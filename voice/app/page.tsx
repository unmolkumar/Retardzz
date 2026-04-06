import { VoiceRoom } from "../components/VoiceRoom";

export default function Home() {
  // Hardcoding a username for testing. 
  // Normally this would come from your auth/login system.
  const randomUsername = `Hacker_${Math.floor(Math.random() * 1000)}`;

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
      <div className="w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Study Room Hub</h1>
          <p className="text-slate-400">Testing standalone voice module</p>
        </div>
        
        {/* Drop in the Voice Room! */}
        <VoiceRoom roomId="physics-study-group" username={randomUsername} />
      </div>
    </main>
  );
}