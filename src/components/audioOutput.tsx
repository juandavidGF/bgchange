type AudioOutputProps = {
  title?: string;
  audioUrl: string | null;
};

export function AudioOutput({ title, audioUrl }: AudioOutputProps) {
  return (
    <div className="w-80 p-4 rounded-lg border border-gray-600 bg-slate-800">
      <div className="text-sm font-medium text-gray-300 mb-2">
        {title || 'Audio Output'}
      </div>
      {audioUrl ? (
        <audio
          controls
          className="w-full"
          src={audioUrl}
        >
          Your browser does not support the audio element.
        </audio>
      ) : (
        <div className="text-gray-500 text-sm italic">
          No audio available yet
        </div>
      )}
    </div>
  );
}