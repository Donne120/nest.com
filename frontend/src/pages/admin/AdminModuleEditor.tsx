import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, Trash2, Video,
  Save, GripVertical, Link as LinkIcon,
  FileText, Film, Globe, File, UploadCloud, X, BookOpen,
} from 'lucide-react';
import api from '../../api/client';
import type { Module, Video as VideoType, Lesson, ModuleResource } from '../../types';
import Button from '../../components/UI/Button';
import QuizBuilder from '../../components/Admin/QuizBuilder';
import TranscriptManager from '../../components/Admin/TranscriptManager';
import RichTextEditor from '../../components/Editor/RichTextEditor';
import LessonEditor from '../../components/Lesson/LessonEditor';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// ─── Video sub-form types ──────────────────────────────────────────────────────

interface VideoForm {
  id?: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number | string;
  order_index: number;
  captions_url: string;
}

function blankVideo(order: number): VideoForm {
  return { title: '', description: '', video_url: '', thumbnail_url: '', duration_seconds: '', order_index: order, captions_url: '' };
}

// ─── Resource type icons ───────────────────────────────────────────────────────

const RESOURCE_TYPES: { value: ModuleResource['type']; label: string; icon: typeof LinkIcon }[] = [
  { value: 'link', label: 'Link', icon: Globe },
  { value: 'doc', label: 'Document', icon: FileText },
  { value: 'pdf', label: 'PDF', icon: File },
  { value: 'video', label: 'Video', icon: Film },
];

function resourceIcon(type: ModuleResource['type']) {
  const cfg = RESOURCE_TYPES.find(t => t.value === type) ?? RESOURCE_TYPES[0];
  const Icon = cfg.icon;
  return <Icon size={14} />;
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-5">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/40">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const inputCls = "w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition";

// ─── Main component ────────────────────────────────────────────────────────────

export default function AdminModuleEditor() {
  const { moduleId } = useParams<{ moduleId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!moduleId;

  // Module form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resources, setResources] = useState<ModuleResource[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);
  const [isPublished, setIsPublished] = useState(true);

  // Video management
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<VideoForm | null>(null);
  const [quizVideoId, setQuizVideoId] = useState<string | null>(null);
  const [quizVideoTitle, setQuizVideoTitle] = useState('');
  const [transcriptVideoId, setTranscriptVideoId] = useState<string | null>(null);

  // Lesson management
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  // Fetch existing data
  const { data: module } = useQuery<Module>({
    queryKey: ['module', moduleId],
    queryFn: () => api.get(`/modules/${moduleId}`).then(r => r.data),
    enabled: isEdit,
  });

  const { data: videos = [] } = useQuery<VideoType[]>({
    queryKey: ['module-videos', moduleId],
    queryFn: () => api.get(`/videos/module/${moduleId}`).then(r => r.data),
    enabled: isEdit,
  });

  const { data: lessons = [] } = useQuery<Lesson[]>({
    queryKey: ['module-lessons', moduleId],
    queryFn: () => api.get(`/lessons/module/${moduleId}`).then(r => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (module) {
      setTitle(module.title);
      setDescription(module.description || '');
      setResources(module.resources ?? []);
      setThumbnailUrl(module.thumbnail_url || '');
      setOrderIndex(module.order_index);
      setIsPublished(module.is_published);
    }
  }, [module]);

  // Mutations
  const saveModule = useMutation({
    mutationFn: () => {
      const payload = {
        title,
        description: description || null,
        resources: resources.length > 0 ? resources : null,
        thumbnail_url: thumbnailUrl || null,
        order_index: orderIndex,
        is_published: isPublished,
      };
      return isEdit
        ? api.put(`/modules/${moduleId}`, payload)
        : api.post('/modules', payload);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] });
      toast.success(isEdit ? 'Module saved!' : 'Module created!');
      if (!isEdit) navigate(`/admin/courses/${res.data.id}/edit`);
    },
    onError: () => toast.error('Failed to save module'),
  });

  const saveVideo = useMutation({
    mutationFn: (v: VideoForm) => {
      const payload = {
        ...v,
        module_id: moduleId,
        duration_seconds: Number(v.duration_seconds) || 0,
        thumbnail_url: v.thumbnail_url || null,
        captions_url: v.captions_url || null,
        description: v.description || null,
      };
      return v.id ? api.put(`/videos/${v.id}`, payload) : api.post('/videos', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-videos', moduleId] });
      setEditingVideo(null);
      toast.success('Video saved!');
    },
    onError: () => toast.error('Failed to save video'),
  });

  const deleteVideo = useMutation({
    mutationFn: (id: string) => api.delete(`/videos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-videos', moduleId] });
      toast.success('Video deleted');
    },
  });

  const createLesson = useMutation({
    mutationFn: () =>
      api.post('/lessons', {
        module_id: moduleId,
        title: 'Untitled Lesson',
        order_index: lessons.length,
        content: [],
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['module-lessons', moduleId] });
      setEditingLessonId(res.data.id);
      toast.success('Lesson created — add your content below');
    },
    onError: () => toast.error('Failed to create lesson'),
  });

  const deleteLesson = useMutation({
    mutationFn: (id: string) => api.delete(`/lessons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-lessons', moduleId] });
      setEditingLessonId(null);
      toast.success('Lesson deleted');
    },
  });

  const handleSaveModule = () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    saveModule.mutate();
  };

  // ─── Resources helpers ───────────────────────────────────────────────────────

  const addResource = () => {
    setResources(prev => [
      ...prev,
      { id: crypto.randomUUID(), title: '', url: '', type: 'link' },
    ]);
  };

  const updateResource = (id: string, field: keyof ModuleResource, value: string) => {
    setResources(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeResource = (id: string) => {
    setResources(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl">

      {/* Back */}
      <button
        onClick={() => navigate('/admin/courses')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-6 transition-colors"
      >
        <ArrowLeft size={15} /> Back to Courses
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Module' : 'Create New Module'}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {isEdit ? 'Update the module content and resources' : 'Set up your onboarding module, add videos and resources'}
        </p>
      </div>

      {/* ─── Module details ─── */}
      <Section title="Module Details">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Welcome to the Team — Getting Started"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Description
              <span className="ml-1.5 text-[11px] font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                Rich text supported
              </span>
            </label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Describe what employees will learn in this module. Use headings, bullet points, bold text to make it clear and engaging…"
              minHeight={180}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <UploadField
                label="Module Cover Image"
                value={thumbnailUrl}
                onChange={setThumbnailUrl}
                accept=".jpg,.jpeg,.png,.webp"
                endpoint="/videos/upload/thumbnail"
                urlPlaceholder="https://…"
              />
              {thumbnailUrl && (
                <img src={thumbnailUrl} alt="Thumbnail" className="mt-2 h-16 w-full object-cover rounded-lg border border-gray-200" onError={() => {}} />
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Order Index</label>
              <input
                type="number" min={0}
                value={orderIndex}
                onChange={e => setOrderIndex(Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>

          {/* Publish toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative flex-shrink-0">
              <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="sr-only peer" />
              <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-brand-600 transition-colors" />
              <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Published</p>
              <p className="text-xs text-gray-400">
                {isPublished ? 'Visible to all employees' : 'Hidden — draft mode'}
              </p>
            </div>
          </label>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
          <Button icon={<Save size={14} />} onClick={handleSaveModule} loading={saveModule.isPending}>
            {isEdit ? 'Save Changes' : 'Create Module'}
          </Button>
        </div>
      </Section>

      {/* ─── Resources section ─── */}
      <Section
        title="Additional Resources"
        action={
          <button
            type="button"
            onClick={addResource}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            <Plus size={13} /> Add resource
          </button>
        }
      >
        {resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
              <LinkIcon size={18} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">No resources yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-3">
              Add docs, links, PDFs or videos for employees to reference
            </p>
            <button
              type="button"
              onClick={addResource}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              + Add first resource
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {resources.map((r) => (
              <div key={r.id} className="flex items-start gap-3 p-3 bg-gray-50/60 border border-gray-200 rounded-xl group">
                {/* Type selector */}
                <select
                  value={r.type}
                  onChange={e => updateResource(r.id, 'type', e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-2 text-xs bg-white text-gray-600 font-medium focus:outline-none focus:ring-1 focus:ring-brand-500 flex-shrink-0"
                >
                  {RESOURCE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>

                {/* Title + URL */}
                <div className="flex-1 min-w-0 space-y-2">
                  <input
                    type="text"
                    value={r.title}
                    onChange={e => updateResource(r.id, 'title', e.target.value)}
                    placeholder="Resource title (e.g. Company Handbook)"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white transition"
                  />
                  <input
                    type="url"
                    value={r.url}
                    onChange={e => updateResource(r.id, 'url', e.target.value)}
                    placeholder="https://…"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white transition"
                  />
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeResource(r.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 mt-0.5"
                  title="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            <p className="text-xs text-gray-400 pt-1">
              Remember to save your module changes to persist these resources.
            </p>
          </div>
        )}
      </Section>

      {/* ─── Videos section ─── */}
      {isEdit && (
        <Section
          title={`Videos (${videos.length})`}
          action={
            <Button
              size="sm"
              icon={<Plus size={13} />}
              onClick={() => setEditingVideo(blankVideo(videos.length))}
              disabled={!!editingVideo}
            >
              Add Video
            </Button>
          }
        >
          {/* Inline new video form */}
          {editingVideo && !editingVideo.id && (
            <div className="mb-3">
              <VideoFormCard
                form={editingVideo}
                setForm={setEditingVideo}
                onSave={() => saveVideo.mutate(editingVideo)}
                onCancel={() => setEditingVideo(null)}
                saving={saveVideo.isPending}
              />
            </div>
          )}

          <div className="space-y-2">
            {videos.map((v, idx) => (
              <div key={v.id} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Video row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <GripVertical size={15} className="text-gray-300 flex-shrink-0 cursor-grab" />
                  <span className="w-6 h-6 rounded-full bg-brand-50 text-[11px] font-bold text-brand-600 flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{v.title}</p>
                    <p className="text-xs text-gray-400">
                      {Math.floor(v.duration_seconds / 60)}m {v.duration_seconds % 60}s
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        if (transcriptVideoId === v.id) { setTranscriptVideoId(null); return; }
                        setTranscriptVideoId(v.id);
                        setQuizVideoId(null);
                        setEditingVideo(null);
                      }}
                      className={clsx(
                        'text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-all',
                        transcriptVideoId === v.id
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                      )}
                    >
                      Transcript
                    </button>
                    <button
                      onClick={() => {
                        if (quizVideoId === v.id) { setQuizVideoId(null); return; }
                        setQuizVideoId(v.id);
                        setQuizVideoTitle(v.title);
                        setEditingVideo(null);
                        setTranscriptVideoId(null);
                      }}
                      className={clsx(
                        'text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-all',
                        quizVideoId === v.id
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'text-brand-600 border-brand-200 hover:bg-brand-50'
                      )}
                    >
                      Quiz
                    </button>
                    <button
                      onClick={() => {
                        setEditingVideo({
                          id: v.id, title: v.title, description: v.description || '',
                          video_url: v.video_url, thumbnail_url: v.thumbnail_url || '',
                          duration_seconds: v.duration_seconds, order_index: v.order_index,
                          captions_url: v.captions_url || '',
                        });
                        setQuizVideoId(null);
                        setTranscriptVideoId(null);
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-700 font-semibold transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { if (confirm('Delete this video and its Q&A?')) deleteVideo.mutate(v.id); }}
                      className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Inline edit form */}
                {editingVideo?.id === v.id && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50/40">
                    <VideoFormCard
                      form={editingVideo}
                      setForm={setEditingVideo}
                      onSave={() => saveVideo.mutate(editingVideo)}
                      onCancel={() => setEditingVideo(null)}
                      saving={saveVideo.isPending}
                    />
                  </div>
                )}

                {/* Transcript manager */}
                {transcriptVideoId === v.id && (
                  <div className="border-t border-indigo-100 p-4 bg-indigo-50/20">
                    <p className="text-xs font-semibold text-indigo-700 mb-3 flex items-center gap-1.5">
                      Transcript for: {v.title}
                    </p>
                    <TranscriptManager
                      videoId={v.id}
                      videoTitle={v.title}
                      hasVideoUrl={!!v.video_url}
                    />
                  </div>
                )}

                {/* Quiz builder */}
                {quizVideoId === v.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50/30">
                    <QuizBuilder videoId={v.id} videoTitle={v.title} />
                  </div>
                )}
              </div>
            ))}

            {videos.length === 0 && !editingVideo && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                  <Video size={18} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">No videos yet</p>
                <p className="text-xs text-gray-400 mt-1">Add videos to this module to get started</p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ─── Lessons section ─── */}
      {isEdit && (
        <Section
          title={`Note Lessons (${lessons.length})`}
          action={
            <Button
              size="sm"
              icon={<Plus size={13} />}
              onClick={() => createLesson.mutate()}
              loading={createLesson.isPending}
            >
              Add Lesson
            </Button>
          }
        >
          <div className="space-y-2">
            {lessons.map((lesson, idx) => (
              <div key={lesson.id} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Lesson row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <GripVertical size={15} className="text-gray-300 flex-shrink-0 cursor-grab" />
                  <span className="w-6 h-6 rounded-full bg-amber-50 text-[11px] font-bold text-amber-600 flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{lesson.title}</p>
                    <p className="text-xs text-gray-400">
                      {lesson.content?.length ?? 0} block{(lesson.content?.length ?? 0) !== 1 ? 's' : ''}
                      {lesson.question_count > 0 && ` · ${lesson.question_count} question${lesson.question_count !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        setEditingLessonId(editingLessonId === lesson.id ? null : lesson.id)
                      }
                      className={clsx(
                        'text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-all',
                        editingLessonId === lesson.id
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'text-amber-600 border-amber-200 hover:bg-amber-50',
                      )}
                    >
                      {editingLessonId === lesson.id ? 'Close' : 'Edit'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this lesson and all its Q&A?'))
                          deleteLesson.mutate(lesson.id);
                      }}
                      className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Inline lesson editor */}
                {editingLessonId === lesson.id && (
                  <div className="border-t border-amber-100 px-4 pb-4 pt-3 bg-amber-50/10">
                    <LessonEditor
                      lesson={lesson}
                      onSaved={() => setEditingLessonId(null)}
                    />
                  </div>
                )}
              </div>
            ))}

            {lessons.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                  <BookOpen size={18} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">No note lessons yet</p>
                <p className="text-xs text-gray-400 mt-1 mb-3">
                  Create lessons with text notes and screenshots — no video required
                </p>
                <button
                  type="button"
                  onClick={() => createLesson.mutate()}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                >
                  + Add first lesson
                </button>
              </div>
            )}
          </div>
        </Section>
      )}

      {!isEdit && (
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-sm text-brand-800">
          <p className="font-semibold mb-0.5">Next steps after creating the module:</p>
          <p className="text-brand-700 text-xs">You'll be able to add videos, quizzes, and more resources once the module is created.</p>
        </div>
      )}
    </div>
  );
}

// ─── File upload widget (URL | Upload tabs) ────────────────────────────────────

interface UploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept: string;
  endpoint: string;      // e.g. '/videos/upload/video'
  urlPlaceholder: string;
  required?: boolean;
}

function UploadField({ label, value, onChange, accept, endpoint, urlPlaceholder, required }: UploadFieldProps) {
  const [mode, setMode] = useState<'url' | 'upload'>(value ? 'url' : 'url');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition";

  const doUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post<{ url: string }>(endpoint, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(data.url);
      toast.success('Uploaded!');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (files?.[0]) doUpload(files[0]);
  };

  return (
    <div>
      {/* Label + tab switcher */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-gray-600">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={clsx('px-2.5 py-1 flex items-center gap-1 transition-colors',
              mode === 'url' ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-50')}
          >
            <LinkIcon size={10} /> URL
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={clsx('px-2.5 py-1 flex items-center gap-1 transition-colors',
              mode === 'upload' ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-50')}
          >
            <UploadCloud size={10} /> Upload
          </button>
        </div>
      </div>

      {mode === 'url' ? (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={urlPlaceholder}
          className={inputCls}
        />
      ) : (
        <div>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
            className={clsx(
              'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
              dragOver ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
            )}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 py-1">
                <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-500">Uploading to Supabase…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 py-1">
                <UploadCloud size={20} className="text-gray-300" />
                <p className="text-xs font-medium text-gray-600">Drop file here or <span className="text-brand-600">browse</span></p>
                <p className="text-[10px] text-gray-400">{accept.replace(/,/g, ' ·').replace(/\./g, '')}</p>
              </div>
            )}
          </div>

          {/* Current URL shown after upload */}
          {value && (
            <div className="flex items-center gap-2 mt-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
              <span className="text-[11px] text-emerald-700 truncate flex-1 font-mono">{value}</span>
              <button type="button" onClick={() => onChange('')} className="text-emerald-400 hover:text-red-500 flex-shrink-0">
                <X size={12} />
              </button>
            </div>
          )}

          <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={e => handleFiles(e.target.files)} />
        </div>
      )}
    </div>
  );
}


// ─── Video sub-form ────────────────────────────────────────────────────────────

interface VideoFormCardProps {
  form: VideoForm;
  setForm: (f: VideoForm) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

function VideoFormCard({ form, setForm, onSave, onCancel, saving }: VideoFormCardProps) {
  const f = (field: keyof VideoForm, value: string | number) => setForm({ ...form, [field]: value });

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition";

  const validate = () => {
    if (!form.title.trim()) { toast.error('Video title required'); return false; }
    if (!form.video_url.trim()) { toast.error('Video URL required'); return false; }
    return true;
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Title <span className="text-red-400">*</span></label>
          <input value={form.title} onChange={e => f('title', e.target.value)} placeholder="Video title" className={inputCls} />
        </div>

        <div className="col-span-2">
          <UploadField
            label="Video"
            value={form.video_url}
            onChange={url => f('video_url', url)}
            accept=".mp4,.webm,.mov,.ogg"
            endpoint="/videos/upload/video"
            urlPlaceholder="https://… (YouTube, Vimeo, mp4, m3u8)"
            required
          />
        </div>

        <div>
          <UploadField
            label="Thumbnail"
            value={form.thumbnail_url}
            onChange={url => f('thumbnail_url', url)}
            accept=".jpg,.jpeg,.png,.webp"
            endpoint="/videos/upload/thumbnail"
            urlPlaceholder="https://…"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Duration (seconds)</label>
          <input type="number" min={0} value={form.duration_seconds} onChange={e => f('duration_seconds', e.target.value)} placeholder="e.g. 600" className={inputCls} />
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
          <textarea rows={2} value={form.description} onChange={e => f('description', e.target.value)} placeholder="Brief description…" className={`${inputCls} resize-none`} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Captions URL <span className="text-gray-400 font-normal">(optional)</span></label>
          <input value={form.captions_url} onChange={e => f('captions_url', e.target.value)} placeholder="https://… (.vtt)" className={inputCls} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button size="sm" icon={<Save size={13} />} onClick={() => { if (validate()) onSave(); }} loading={saving}>
          Save Video
        </Button>
      </div>
    </div>
  );
}
