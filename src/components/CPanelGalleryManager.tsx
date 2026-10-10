import React from 'react';
import { GalleryPhoto } from '../types';
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Pencil, 
  CheckCircle, 
  Plus, 
  X, 
  Link as LinkIcon, 
  Calendar, 
  Tag, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  Maximize2,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';

interface CPanelGalleryManagerProps {
  photos: GalleryPhoto[];
  onAddPhoto: (photo: Omit<GalleryPhoto, 'id'>) => void;
  onUpdatePhoto: (photo: GalleryPhoto) => void;
  onDeletePhoto: (id: string) => void;
}

const PRESET_CATEGORIES = [
  'জশনে জুলুস',
  'মাহফিল ময়দান',
  'আলোকসজ্জা ও সাজসজ্জা',
  'তাবাররুক বিতরণ',
  'প্রস্তুতি ও সভা',
  'অতিথিবৃন্দ ও ওলামায়ে কেরাম',
  'অন্যান্য'
];

export default function CPanelGalleryManager({
  photos = [],
  onAddPhoto,
  onUpdatePhoto,
  onDeletePhoto
}: CPanelGalleryManagerProps) {
  // Upload method toggle: 'file' | 'url'
  const [uploadMethod, setUploadMethod] = React.useState<'file' | 'url'>('file');

  // Form State
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState('জশনে জুলুস');
  const [customCategory, setCustomCategory] = React.useState('');
  const [date, setDate] = React.useState('১২ই রবিউল আউয়াল');
  const [imageUrl, setImageUrl] = React.useState('');
  const [filePreview, setFilePreview] = React.useState<string | null>(null);
  const [serialNo, setSerialNo] = React.useState<number>(photos.length + 1);
  const [isCompressing, setIsCompressing] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');

  // Editing State
  const [editingPhoto, setEditingPhoto] = React.useState<GalleryPhoto | null>(null);
  const [previewModalPhoto, setPreviewModalPhoto] = React.useState<GalleryPhoto | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('all');

  // Bengali digits converter
  const toBanglaNum = (num: number | string): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    if (num === undefined || num === null) return '';
    return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
  };

  // Handle client-side image compression & loading into Base64
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল (JPG, PNG, WebP) নির্বাচন করুন।');
      return;
    }

    setIsCompressing(true);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        // Max dimensions for sharp yet high-efficiency storage
        const MAX_WIDTH = 1400;
        const MAX_HEIGHT = 1050;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Export as clean JPEG/WebP data URI
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFilePreview(compressedDataUrl);
          setIsCompressing(false);
        } else {
          setFilePreview(readerEvent.target?.result as string);
          setIsCompressing(false);
        }
      };
      img.onerror = () => {
        setErrorMsg('ছবি প্রসেস করতে সমস্যা হয়েছে। অন্য একটি ছবি নির্বাচন করুন।');
        setIsCompressing(false);
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const finalUrl = uploadMethod === 'file' ? filePreview : imageUrl.trim();

    if (!finalUrl) {
      setErrorMsg('অনুগ্রহ করে একটি ছবি ফাইল আপলোড করুন অথবা ছবির অনলাইন লিংক প্রদান করুন।');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('অনুগ্রহ করে ছবির শিরোনাম বা বিবরণ লিখুন।');
      return;
    }

    const finalCategory = category === 'নতুন ক্যাটাগরি' ? customCategory.trim() || 'অন্যান্য' : category;

    onAddPhoto({
      title: title.trim(),
      url: finalUrl,
      category: finalCategory,
      date: date.trim() || undefined,
      serialNo: Number(serialNo) || photos.length + 1
    });

    setSuccessMsg('ফটো গ্যালারীতে নতুন ছবি সফলভাবে যুক্ত হয়েছে!');
    // Reset form
    setTitle('');
    setImageUrl('');
    setFilePreview(null);
    setCustomCategory('');
    setSerialNo(photos.length + 2);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;

    onUpdatePhoto(editingPhoto);
    setEditingPhoto(null);
    setSuccessMsg('ছবির তথ্য সফলভাবে আপডেট করা হয়েছে!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Reorder items
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= photos.length) return;

    const currentItem = { ...photos[index] };
    const targetItem = { ...photos[targetIdx] };

    const currentSerial = currentItem.serialNo ?? (index + 1);
    const targetSerial = targetItem.serialNo ?? (targetIdx + 1);

    currentItem.serialNo = targetSerial;
    targetItem.serialNo = currentSerial;

    onUpdatePhoto(currentItem);
    onUpdatePhoto(targetItem);
  };

  // Filtered photos list for management
  const filteredList = photos.filter((p) => {
    const matchesSearch = searchQuery === '' || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner Alert / Success */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-xl flex items-center gap-3 shadow-sm animate-fade-in">
          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-bold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-300 text-red-800 p-4 rounded-xl flex items-center gap-3 shadow-sm animate-fade-in">
          <X className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span className="text-sm font-bold">{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Upload / Add Form (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm space-y-6 sticky top-6">
          <div className="border-b border-[#e2e8f0] pb-3">
            <h4 className="text-base font-bold text-[#064e3b] flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#d97706]" />
              <span>গ্যালারীতে নতুন ছবি আপলোড করুন</span>
            </h4>
            <p className="text-xs text-[#64748b] mt-1 font-light">
              মোবাইল/কম্পিউটার হতে সরাসরি ছবি আপলোড করুন অথবা অনলাইন ফটো লিঙ্ক দিন
            </p>
          </div>

          {/* Upload Method Selector */}
          <div className="grid grid-cols-2 gap-2 bg-[#f1f5f9] p-1.5 rounded-xl border border-[#cbd5e1]/60">
            <button
              type="button"
              onClick={() => setUploadMethod('file')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                uploadMethod === 'file'
                  ? 'bg-white text-[#064e3b] shadow-sm border border-[#cbd5e1]'
                  : 'text-[#64748b] hover:text-[#064e3b]'
              }`}
            >
              <ImageIcon className="h-4 w-4 text-[#d97706]" />
              <span>ফাইল আপলোড</span>
            </button>
            <button
              type="button"
              onClick={() => setUploadMethod('url')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                uploadMethod === 'url'
                  ? 'bg-white text-[#064e3b] shadow-sm border border-[#cbd5e1]'
                  : 'text-[#64748b] hover:text-[#064e3b]'
              }`}
            >
              <LinkIcon className="h-4 w-4 text-[#0f766e]" />
              <span>অনলাইন লিঙ্ক (URL)</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* File Upload Zone */}
            {uploadMethod === 'file' ? (
              <div>
                <label className="block text-[11px] font-bold text-[#0f766e] uppercase mb-1.5">
                  ছবি নির্বাচন করুন (File / Camera) *
                </label>
                
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center transition flex flex-col items-center justify-center relative bg-[#f8fafc] hover:bg-[#f1f5f9] ${
                    filePreview ? 'border-[#0f766e]' : 'border-[#cbd5e1]'
                  }`}
                >
                  {filePreview ? (
                    <div className="space-y-3 w-full">
                      <div className="relative h-44 w-full rounded-xl overflow-hidden bg-black/40 border border-[#cbd5e1]">
                        <img
                          src={filePreview}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setFilePreview(null)}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition shadow-md cursor-pointer"
                          title="ছবি মুছুন"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-[11px] text-[#0f766e] font-semibold flex items-center justify-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>ছবি সফলভাবে লোড হয়েছে</span>
                      </p>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center py-6 w-full">
                      <div className="h-12 w-12 rounded-full bg-[#0f766e]/10 flex items-center justify-center text-[#0f766e] mb-2">
                        {isCompressing ? (
                          <div className="h-6 w-6 border-2 border-[#0f766e] border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Upload className="h-6 w-6 text-[#d97706]" />
                        )}
                      </div>
                      <span className="font-bold text-[#064e3b] text-xs">
                        {isCompressing ? 'ছবি অপ্টিমাইজ হচ্ছে...' : 'ছবি সিলেক্ট করতে ক্লিক করুন'}
                      </span>
                      <span className="text-[10px] text-[#64748b] mt-0.5">
                        বা এখানে টেনে এনে ছেড়ে দিন (JPG, PNG, WebP)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-[#0f766e] uppercase mb-1">
                  ছবির ডিরেক্ট ওয়েব লিঙ্ক (URL) *
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... অথবা গুগল ড্রাইভ লিঙ্ক"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-xs focus:outline-none focus:border-[#0f766e]"
                />
                {imageUrl && (
                  <div className="mt-2 h-32 w-full rounded-xl overflow-hidden bg-slate-900 border border-[#cbd5e1]">
                    <img
                      src={imageUrl}
                      alt="URL Preview"
                      className="w-full h-full object-contain"
                      onError={() => setErrorMsg('প্রদত্ত লিঙ্ক থেকে ছবি লোড করা যাচ্ছে না।')}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Photo Title */}
            <div>
              <label className="block text-[11px] font-bold text-[#0f766e] uppercase mb-1">
                ছবির ক্যাপশন / শিরোনাম *
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: বর্ণাঢ্য জশনে জুলুসের অগ্রযাত্রা"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-xs font-bold text-[#064e3b] focus:outline-none focus:border-[#0f766e]"
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-[11px] font-bold text-[#0f766e] uppercase mb-1">
                ক্যাটাগরি / বিভাগ
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-xs font-medium text-[#064e3b] focus:outline-none focus:border-[#0f766e]"
              >
                {PRESET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="নতুন ক্যাটাগরি">+ নতুন ক্যাটাগরি লিখুন</option>
              </select>

              {category === 'নতুন ক্যাটাগরি' && (
                <input
                  type="text"
                  placeholder="ক্যাটাগরির নাম লিখুন"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-2 w-full p-2 bg-white border border-[#cbd5e1] rounded-lg text-xs"
                />
              )}
            </div>

            {/* Date & Serial */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#0f766e] uppercase mb-1">
                  তারিখ / উপলক্ষ
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ১২ই রবিউল আউয়াল"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#0f766e] uppercase mb-1">
                  ক্রম নম্বর (Serial No)
                </label>
                <input
                  type="number"
                  value={serialNo}
                  onChange={(e) => setSerialNo(parseInt(e.target.value, 10) || 1)}
                  className="w-full p-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCompressing}
              className="w-full py-3 bg-[#d97706] hover:bg-[#b45309] text-white font-black rounded-xl text-xs shadow-md transition-all hover:scale-[1.02] active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>গ্যালারীতে যুক্ত করুন</span>
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Gallery Management & List (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#e2e8f0] pb-4">
            <div>
              <h4 className="text-base font-bold text-[#064e3b] flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-[#0f766e]" />
                <span>বর্তমান ফটো গ্যালারী তালিকা</span>
                <span className="bg-[#0f766e]/10 text-[#0f766e] text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-[#0f766e]/20">
                  {toBanglaNum(photos.length)}টি
                </span>
              </h4>
              <p className="text-xs text-[#64748b] mt-0.5 font-light">
                ছবির ক্রম পরিবর্তন করতে তীর চিহ্নে ক্লিক করুন অথবা সম্পাদনা করুন
              </p>
            </div>
          </div>

          {/* Search and Category Filter */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="ছবির নাম দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-xs text-[#3c3c3c] focus:outline-none focus:border-[#0f766e]"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full py-2 px-3 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-xs font-medium text-[#064e3b] focus:outline-none"
              >
                <option value="all">সকল ক্যাটাগরি</option>
                {PRESET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Photos List */}
          {filteredList.length === 0 ? (
            <div className="py-14 text-center border-2 border-dashed border-[#e2e8f0] rounded-2xl space-y-2">
              <ImageIcon className="h-10 w-10 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-500 font-medium">কোনো ছবি পাওয়া যায়নি।</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
              {filteredList.map((photo, index) => (
                <div
                  key={photo.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] hover:border-[#d97706]/60 rounded-xl transition duration-200 group"
                >
                  {/* Left: Thumbnail & Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div 
                      className="relative h-16 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800 border border-[#cbd5e1] cursor-pointer"
                      onClick={() => setPreviewModalPhoto(photo)}
                      title="বড় আকারে দেখুন"
                    >
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <Eye className="h-4 w-4 text-white" />
                      </div>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-[#064e3b] text-white text-[10px] font-bold flex items-center justify-center font-mono">
                          {toBanglaNum(photo.serialNo ?? (index + 1))}
                        </span>
                        {photo.category && (
                          <span className="bg-[#d97706]/10 text-[#d97706] text-[10px] font-extrabold px-2 py-0.5 rounded border border-[#d97706]/20">
                            {photo.category}
                          </span>
                        )}
                        {photo.date && (
                          <span className="text-[10px] text-gray-500 font-medium hidden sm:inline">
                            • {photo.date}
                          </span>
                        )}
                      </div>
                      <h5 className="font-bold text-xs text-[#064e3b] truncate" title={photo.title}>
                        {photo.title}
                      </h5>
                    </div>
                  </div>

                  {/* Right: Actions (Reorder, Edit, Delete) */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto flex-shrink-0">
                    {/* Move Up/Down */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      className="p-1.5 bg-white hover:bg-[#e2e8f0] disabled:opacity-30 disabled:hover:bg-white text-gray-700 border border-[#cbd5e1] rounded-lg transition cursor-pointer"
                      title="উপরে নিন"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === photos.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      className="p-1.5 bg-white hover:bg-[#e2e8f0] disabled:opacity-30 disabled:hover:bg-white text-gray-700 border border-[#cbd5e1] rounded-lg transition cursor-pointer"
                      title="নিচে নিন"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => setEditingPhoto(photo)}
                      className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition cursor-pointer"
                      title="সম্পাদনা করুন"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`আপনি কি নিশ্চিতভাবে "${photo.title}" ছবিটি গ্যালারী থেকে মুছে ফেলতে চান?`)) {
                          onDeletePhoto(photo.id);
                        }
                      }}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* EDIT PHOTO MODAL */}
      {editingPhoto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-[#cbd5e1] animate-scale-up">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <h4 className="font-bold text-[#064e3b] text-base flex items-center gap-2">
                <Pencil className="h-4 w-4 text-[#d97706]" />
                <span>ছবির তথ্য সম্পাদনা</span>
              </h4>
              <button
                onClick={() => setEditingPhoto(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="h-36 w-full rounded-xl overflow-hidden bg-slate-900 border border-[#cbd5e1] mb-2">
                <img
                  src={editingPhoto.url}
                  alt={editingPhoto.title}
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0f766e] mb-1">ছবির ক্যাপশন / শিরোনাম *</label>
                <input
                  type="text"
                  required
                  value={editingPhoto.title}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, title: e.target.value })}
                  className="w-full p-2.5 border border-[#cbd5e1] rounded-lg font-bold text-[#064e3b]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0f766e] mb-1">ক্যাটাগরি</label>
                <select
                  value={editingPhoto.category || 'জশনে জুলুস'}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, category: e.target.value })}
                  className="w-full p-2.5 border border-[#cbd5e1] rounded-lg"
                >
                  {PRESET_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0f766e] mb-1">তারিখ / উপলক্ষ</label>
                  <input
                    type="text"
                    value={editingPhoto.date || ''}
                    onChange={(e) => setEditingPhoto({ ...editingPhoto, date: e.target.value })}
                    className="w-full p-2 border border-[#cbd5e1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0f766e] mb-1">ক্রম নম্বর</label>
                  <input
                    type="number"
                    value={editingPhoto.serialNo || 1}
                    onChange={(e) => setEditingPhoto({ ...editingPhoto, serialNo: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2 border border-[#cbd5e1] rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setEditingPhoto(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d9488] text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK PREVIEW MODAL */}
      {previewModalPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewModalPhoto(null)}
        >
          <div
            className="max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-white/20 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-80 sm:h-96 w-full bg-slate-900">
              <img
                src={previewModalPhoto.url}
                alt={previewModalPhoto.title}
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setPreviewModalPhoto(null)}
                className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-1">
              <span className="bg-[#d97706] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                {previewModalPhoto.category}
              </span>
              <h4 className="font-bold text-[#064e3b] text-base">{previewModalPhoto.title}</h4>
              {previewModalPhoto.date && <p className="text-xs text-gray-500">{previewModalPhoto.date}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
