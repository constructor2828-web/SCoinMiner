import { useState, useEffect, useRef } from 'react';
import { Pickaxe, Activity, Box, Server, Settings, Play, Square, Wallet, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import './index.css';

function App() {
  const [isMining, setIsMining] = useState(false);
  const [hashRate, setHashRate] = useState(0);
  const [blocksMined, setBlocksMined] = useState(0);
  const [difficultyLevel, setDifficultyLevel] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [walletAddress, setWalletAddress] = useState(localStorage.getItem('miner_wallet') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('Ready');

  const getDifficultySettings = () => {
    switch(difficultyLevel) {
      case 'easy': return { zeros: 3, reward: 0.05 };
      case 'medium': return { zeros: 4, reward: 0.15 };
      case 'hard': return { zeros: 5, reward: 0.50 };
    }
  };
  
  const workerRef = useRef<Worker | null>(null);

  if (!supabase) {
    return (
      <div className="h-screen w-screen bg-background text-foreground flex items-center justify-center p-6 text-center">
        <div className="bg-destructive/10 border border-destructive/20 p-8 rounded-2xl max-w-md">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error de Configuración</h1>
          <p className="text-muted-foreground">
            No se han encontrado las credenciales de Supabase. 
            Asegúrate de tener el archivo <code className="bg-muted px-1 rounded">.env</code> configurado correctamente.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    localStorage.setItem('miner_wallet', walletAddress);
  }, [walletAddress]);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const submitBlock = async (payload: any) => {
    if (!walletAddress) return;
    
    setIsSubmitting(true);
    setStatus('Submitting Block...');
    
    try {
      const { reward } = getDifficultySettings();
      const { error } = await supabase.rpc('submit_block', {
        p_miner_wallet: walletAddress,
        p_nonce: payload.nonce,
        p_hash: payload.hash,
        p_difficulty: payload.difficulty,
        p_reward: reward
      });

      if (error) throw error;
      
      setBlocksMined((prev) => prev + 1);
      setStatus('Block Verified!');
      setTimeout(() => setStatus(isMining ? 'Mining...' : 'Ready'), 2000);
    } catch (err: any) {
      console.error('Error submitting block:', err);
      setStatus('Submission Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMining = () => {
    if (!walletAddress) {
      alert('Please enter a wallet address first!');
      return;
    }

    if (isMining) {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      setIsMining(false);
      setHashRate(0);
      setStatus('Ready');
    } else {
      workerRef.current = new Worker(new URL('./miner.worker.ts', import.meta.url), {
        type: 'module',
      });

      workerRef.current.onmessage = (e) => {
        const { type, payload } = e.data;
        if (type === 'HASHRATE_UPDATE') {
          setHashRate(payload.hashRate);
        } else if (type === 'BLOCK_FOUND') {
          console.log(`Block Found! Hash: ${payload.hash}, Nonce: ${payload.nonce}`);
          submitBlock(payload);
          
          // Continue mining after submission
          if (workerRef.current) {
              const { zeros } = getDifficultySettings();
              workerRef.current.postMessage({
                type: 'START_MINING',
                payload: {
                  blockData: `S-Coin-Block-${Date.now()}`,
                  difficulty: zeros,
                  minerWallet: walletAddress,
                },
              });
          }
        }
      };

      const { zeros } = getDifficultySettings();
      workerRef.current.postMessage({
        type: 'START_MINING',
        payload: {
          blockData: `S-Coin-Block-${Date.now()}`,
          difficulty: zeros,
          minerWallet: walletAddress,
        },
      });

      setIsMining(true);
      setStatus('Mining...');
    }
  };

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg shadow-lg shadow-primary/20">
            <Pickaxe className="text-gold h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lumina Miner</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${isMining ? 'bg-success animate-pulse' : 'bg-muted'}`}></span>
              {status}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card border border-border px-4 py-2 rounded-full shadow-sm">
          <Server className="h-4 w-4" />
          Mainnet Node
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Status Card */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Activity className="h-48 w-48" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Real-time Hashrate</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-7xl font-black text-gold drop-shadow-sm">
                {hashRate > 1000 ? (hashRate / 1000).toFixed(2) : hashRate}
              </span>
              <span className="text-2xl font-bold text-muted-foreground">
                {hashRate > 1000 ? 'kH/s' : 'H/s'}
              </span>
            </div>
          </div>

          <div className="mt-8 space-y-4 relative z-10">
            <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Recipient Wallet Address</label>
                <div className="relative">
                    <input 
                        type="text"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        placeholder="Enter your SC... address"
                        disabled={isMining}
                        className="w-full bg-background/50 border border-border rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
                    />
                    <Wallet className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                </div>
            </div>

            <button
              onClick={toggleMining}
              className={`w-full py-4 rounded-lg font-black text-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 ${
                isMining 
                  ? 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20' 
                  : 'bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:bg-primary/90'
              }`}
            >
              {isMining ? <Square className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
              {isMining ? 'STOP MINER' : 'START MINER'}
            </button>
          </div>
        </div>

        {/* Stats Column */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex-1 group transition-all hover:border-blue-500/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <Box className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Blocks Mined</h3>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black">{blocksMined}</span>
                {isSubmitting && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex-1 group transition-all hover:border-orange-500/50">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                <Settings className="h-5 w-5 text-orange-500" />
              </div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Difficulty Level</h3>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficultyLevel(level)}
                    disabled={isMining}
                    className={`py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                      difficultyLevel === level 
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    } disabled:opacity-50`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-background/50 border border-border flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Est. Reward</span>
                <span className="font-mono text-gold font-bold">{getDifficultySettings().reward} LMN</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-border pt-4 flex justify-between items-center text-[10px] text-muted-foreground uppercase font-mono tracking-widest">
        <div className="flex items-center gap-4">
          <span>Engine: SHA-256 (JS-Worker)</span>
          <span>Network: v1.0.0-PROD</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
          NODE_ONLINE
        </div>
      </footer>
    </div>
  );
}

export default App;
