'use client';

import { useState } from 'react';
import { Building2, Image as ImageIcon, FileText, Users } from 'lucide-react';
import ProfileEditor from './ProfileEditor';
import ActivityManager from './ActivityManager';
import DocumentManager from './DocumentManager';

type Tab = 'profil' | 'galeri' | 'dokumen' | 'alumni';

interface Props {
  profile: any;
  activities: any[];
  documents: any[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  userId: string;
  initialTab?: Tab;
}

export default function TentangKamiTabs({
  profile,
  activities,
  documents,
  canCreate,
  canUpdate,
  canDelete,
  userId,
  initialTab = 'profil',
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TabButton 
          active={activeTab === 'profil'} 
          onClick={() => setActiveTab('profil')}
          icon={<Building2 className="h-5 w-5" />}
          title="Profil Asrama"
          desc="Edit teks sejarah & visi misi"
        />
        <TabButton 
          active={activeTab === 'galeri'} 
          onClick={() => setActiveTab('galeri')}
          icon={<ImageIcon className="h-5 w-5" />}
          title="Galeri Kegiatan"
          desc="Kelola foto kegiatan"
        />
        <TabButton 
          active={activeTab === 'dokumen'} 
          onClick={() => setActiveTab('dokumen')}
          icon={<FileText className="h-5 w-5" />}
          title="Dokumentasi"
          desc="Upload AD/ART dll"
        />
        <button 
          disabled
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed transition-all"
        >
          <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div className="text-center">
            <h3 className="font-bold text-sm">Buku Alumni</h3>
            <p className="text-[10px] uppercase tracking-wider font-bold mt-1 text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full inline-block">Segera Hadir</p>
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        {activeTab === 'profil' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Edit Profil Asrama</h2>
            <ProfileEditor profile={profile} canEdit={canUpdate} userId={userId} />
          </div>
        )}
        
        {activeTab === 'galeri' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Kelola Galeri Kegiatan</h2>
            <ActivityManager
              activities={activities}
              canCreate={canCreate}
              canUpdate={canUpdate}
              canDelete={canDelete}
            />
          </div>
        )}

        {activeTab === 'dokumen' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Kelola Dokumentasi & AD/ART</h2>
            <DocumentManager
              documents={documents}
              canCreate={canCreate}
              canDelete={canDelete}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, title, desc }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${
        active 
          ? 'border-blue-500 bg-blue-50 shadow-sm' 
          : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50'
      }`}
    >
      <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
        active ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 text-slate-500'
      }`}>
        {icon}
      </div>
      <div className="text-center">
        <h3 className={`font-bold text-sm ${active ? 'text-blue-700' : 'text-slate-700'}`}>{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
    </button>
  );
}
