'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app][error-boundary]', {
      message: error?.message,
      stack: error?.stack,
      digest: error?.digest
    })
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
          <div className="max-w-lg w-full rounded-lg border border-red-200 bg-white p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">页面加载失败</h2>
            <p className="text-sm text-gray-600 mb-6">系统已捕获异常，请重试或稍后再访问。</p>
            <button
              onClick={() => reset()}
              className="rounded-md bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
