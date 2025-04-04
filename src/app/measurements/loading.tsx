export default function Loading() {
  return (
    <div className='flex flex-col items-center justify-center h-screen gap-4'>
      <div className='w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin'></div>
      <p className='text-gray-500'>Loading...</p>
    </div>
  );
}
