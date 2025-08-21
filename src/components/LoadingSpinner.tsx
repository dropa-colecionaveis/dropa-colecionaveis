export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-white text-xl">Carregando...</div>
        <div className="text-gray-300 text-sm mt-2">Verificando autenticação</div>
      </div>
    </div>
  )
}