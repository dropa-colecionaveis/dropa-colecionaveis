export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-3"></div>
        <div className="text-white text-lg">Entrando...</div>
      </div>
    </div>
  )
}