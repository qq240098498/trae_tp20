import Header from '@/components/Header';
import LoanForm from '@/components/LoanForm';
import ResultCard from '@/components/ResultCard';
import PieChart from '@/components/PieChart';
import BarChart from '@/components/BarChart';
import ScheduleTable from '@/components/ScheduleTable';
import { useLoanStore } from '@/store/loanStore';

export default function Home() {
  const { result } = useLoanStore();
  const hasResult = result && result.totalPrincipal > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <LoanForm />
          </div>

          <div className="lg:col-span-7 space-y-6">
            <ResultCard />

            {hasResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <PieChart />
                <BarChart />
              </div>
            )}

            {hasResult && <ScheduleTable />}
          </div>
        </div>

        <footer className="mt-16 text-center text-xs text-slate-400">
          <p>本计算器仅供参考，实际还款金额以银行为准</p>
        </footer>
      </main>
    </div>
  );
}