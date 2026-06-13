import { Calculator, Home, Sparkles } from 'lucide-react';

export default function Header() {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] via-[#234e7c] to-[#0d9488] text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="absolute top-20 -left-16 w-72 h-72 rounded-full bg-amber-400/15 blur-3xl" />
        <svg className="absolute bottom-0 left-0 right-0 h-16 w-full" preserveAspectRatio="none" viewBox="0 0 1440 64">
          <path fill="currentColor" className="text-slate-50" d="M0,32L80,37.3C160,43,320,53,480,48C640,43,800,21,960,16C1120,11,1280,21,1360,26.7L1440,32L1440,64L1360,64C1280,64,1120,64,960,64C800,64,640,64,480,64C320,64,160,64,80,64L0,64Z" />
        </svg>
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
            <Home className="w-7 h-7 text-amber-300" strokeWidth={2} />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 ring-1 ring-white/20 backdrop-blur-sm flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            专业房贷计算工具
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3" style={{ fontFamily: '"Noto Serif SC", "Source Han Serif SC", Georgia, serif' }}>
          房贷计算器
        </h1>
        <p className="text-lg sm:text-xl text-white/80 max-w-2xl leading-relaxed">
          支持商业贷款、公积金贷款、组合贷款三种模式，等额本息/等额本金还款方式，
          一键生成完整还款计划与本息对比分析。
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/15">
            <Calculator className="w-4 h-4 text-teal-300" />
            <span>精准计算</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/15">
            <svg className="w-4 h-4 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m7 15 4-4 4 4 5-5"/></svg>
            <span>数据可视化</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/15">
            <svg className="w-4 h-4 text-teal-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"/></svg>
            <span>组合贷款</span>
          </div>
        </div>
      </div>
    </header>
  );
}
