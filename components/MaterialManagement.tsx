
import React, { useState, useRef } from 'react';
import { Material } from '../types';
import { 
  IconFile, 
  IconPresentation, 
  IconZap, 
  IconPlus, 
  IconX, 
  IconUpload, 
  IconTrash
} from './Icons';
import { vectorService } from '../services/vectorService';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
          <IconX className="w-6 h-6" />
        </button>
      </div>
      <div className="p-6 max-h-[80vh] overflow-y-auto">
        {children}
      </div>
    </div>
  </div>
);

interface MaterialManagementProps {
  materials: Material[];
  onAdd: (mat: Material) => void;
  onUpdateStatus: (id: string, status: 'READY' | 'FAILED' | 'PROCESSING') => void;
}

const MaterialManagement: React.FC<MaterialManagementProps> = ({ materials, onAdd, onUpdateStatus }) => {
  const [activeModal, setActiveModal] = useState<'UPLOAD' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadForm, setUploadForm] = useState<{
    title: string;
    type: 'PDF' | 'PPTX' | 'DOCX';
    file: File | null;
  }>({
    title: '',
    type: 'PDF',
    file: null
  });

  const handleOpenUpload = () => {
    setUploadForm({ title: '', type: 'PDF', file: null });
    setActiveModal('UPLOAD');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const processFile = (file: File) => {
    const extension = file.name.split('.').pop()?.toUpperCase();
    let type: 'PDF' | 'PPTX' | 'DOCX' = 'PDF';
    if (extension === 'PPTX' || extension === 'PPT') type = 'PPTX';
    if (extension === 'DOCX' || extension === 'DOC') type = 'DOCX';

    setUploadForm({
      ...uploadForm,
      title: file.name.replace(/\.[^/.]+$/, ""),
      type: type,
      file: file
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
  };

  const handleConfirmUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file && !uploadForm.title) return;

    const tempId = `mat_${Date.now()}`;
    const newTitle = uploadForm.title;
    
    onAdd({
      id: tempId,
      courseId: 'c1',
      tenantId: 't1',
      title: newTitle,
      type: uploadForm.type,
      url: '#',
      status: 'PROCESSING'
    });

    setActiveModal(null);
    setIsProcessing(true);

    try {
      await vectorService.runIndexingJob(tempId, newTitle, 't1', 'c1');
      onUpdateStatus(tempId, 'READY');
    } catch (error) {
      onUpdateStatus(tempId, 'FAILED');
    } finally {
      setIsProcessing(false);
      setUploadForm({ title: '', type: 'PDF', file: null });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">課程教材管理</h2>
          <p className="text-sm text-slate-500">所有教材皆受 Multi-Tenant 隔離保護，僅限本課程學生檢索。</p>
        </div>
        <button 
          onClick={handleOpenUpload}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-lg transition-all font-medium"
        >
          <IconPlus className="w-5 h-5" />
          上傳新教材
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((mat) => (
          <div key={mat.id} className={`bg-white p-5 rounded-2xl border transition-all group ${
            mat.status === 'PROCESSING' ? 'border-indigo-100 bg-indigo-50/30' : 'border-slate-200 shadow-sm hover:shadow-md'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`p-4 rounded-xl transition-colors ${
                mat.status === 'PROCESSING' ? 'bg-indigo-100 text-indigo-600 animate-pulse' :
                mat.type === 'PDF' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {mat.status === 'PROCESSING' ? <IconZap className="w-6 h-6" /> : 
                 mat.type === 'PDF' ? <IconFile className="w-6 h-6" /> : <IconPresentation className="w-6 h-6" />}
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{mat.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">{mat.type}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    mat.status === 'READY' ? 'bg-emerald-100 text-emerald-700' : 
                    mat.status === 'PROCESSING' ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {mat.status === 'READY' ? '已就緒' : mat.status === 'PROCESSING' ? '正在建立索引' : '處理失敗'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeModal === 'UPLOAD' && (
        <Modal title="上傳教材資料" onClose={() => setActiveModal(null)}>
          <form onSubmit={handleConfirmUpload} className="space-y-6">
            <div 
              className={`relative border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center cursor-pointer ${
                dragActive ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : 'border-slate-200 bg-slate-50 hover:border-indigo-300'
              }`}
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.pptx" />
              {!uploadForm.file ? (
                <>
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-500 mb-4"><IconUpload /></div>
                  <p className="text-slate-700 font-bold">點擊或拖拽檔案至此處</p>
                  <p className="text-slate-400 text-xs mt-1">支援 PDF, PPT, Word</p>
                </>
              ) : (
                <div className="w-full flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-indigo-100">
                  <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl"><IconFile className="w-8 h-8" /></div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-slate-800 truncate">{uploadForm.file.name}</p>
                    <p className="text-[10px] text-slate-400">{(uploadForm.file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setUploadForm({...uploadForm, file: null}); }} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"><IconTrash /></button>
                </div>
              )}
            </div>
            <button type="submit" disabled={!uploadForm.file && !uploadForm.title} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <IconZap className="w-5 h-5" /> 啟動 RAG 向量化 Pipeline
            </button>
          </form>
        </Modal>
      )}
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-xs text-center border animate-pulse">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-bold text-slate-800">正在處理教材向量...</h3>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialManagement;
