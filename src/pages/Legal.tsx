import React from 'react';
import { ArrowLeft, BadgeInfo } from 'lucide-react';
import { LEGAL_DOCUMENTS, LEGAL_OWNER, LegalDocumentId } from '../legal';

interface LegalPageProps {
  documentId: LegalDocumentId;
  onBack: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ documentId, onBack }) => {
  const document = LEGAL_DOCUMENTS[documentId];

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="w-11 h-11 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:text-orange-500 active:scale-95 transition-all flex items-center justify-center"
          aria-label="Назад"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-end text-right">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Документ</span>
          <span className="text-xs font-bold text-orange-500">Обновлено {document.updatedAt}</span>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-black leading-tight text-zinc-900 dark:text-zinc-100">
            {document.title}
          </h1>
          <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            {document.intro}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-[28px] border border-zinc-100 dark:border-zinc-800 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-orange-500">
            <BadgeInfo size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Реквизиты</span>
          </div>
          <div className="grid gap-2 text-sm">
            <div className="flex items-start justify-between gap-4">
              <span className="text-zinc-400 font-medium">Исполнитель</span>
              <span className="text-right font-bold text-zinc-900 dark:text-zinc-100">{LEGAL_OWNER.legalName}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-400 font-medium">ОГРНИП</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{LEGAL_OWNER.ogrnip}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-400 font-medium">ИНН</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{LEGAL_OWNER.inn}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-4">
        {document.sections.map((section) => (
          <section
            key={section.title}
            className="bg-white dark:bg-zinc-900 rounded-[28px] border border-zinc-100 dark:border-zinc-800 p-5 flex flex-col gap-3"
          >
            <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100">
              {section.title}
            </h2>
            <div className="flex flex-col gap-3">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
