import { useState } from 'react'
import axios from 'axios'

const API_URL = ''

interface JobStatus {
  jobId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: {
    total: number
    completed: number
    failed: number
    currentSong?: string
  }
  playlistName?: string
  shareCode?: string
  expiresAt?: string
}

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url) {
      setError('Please enter a Suno URL')
      return
    }
    
    setLoading(true)
    setError('')
    setJobStatus(null)
    
    try {
      const response = await axios.post(`${API_URL}/api/download`, {
        url,
        options: {}
      })
      
      const { jobId } = response.data
      pollJobStatus(jobId)
    } catch (err) {
      setLoading(false)
      setError(axios.isAxiosError(err) ? err.response?.data?.error || 'Failed to start download' : 'An error occurred')
    }
  }

  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_URL}/api/download/${jobId}/status`)
        const status = response.data
        
        setJobStatus(status)
        
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval)
          setLoading(false)
        }
      } catch (err) {
        clearInterval(interval)
        setLoading(false)
        setError('Failed to check download status')
      }
    }, 1000)
  }

  const getShareLink = () => {
    if (!jobStatus?.shareCode) return ''
    const baseUrl = window.location.origin
    return `${baseUrl}/share/${jobStatus.shareCode}`
  }

  const copyToClipboard = () => {
    const link = getShareLink()
    if (link) {
      navigator.clipboard.writeText(link)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <div className="container">
      <div className="card">
        <div className="title">
          <h1>Suno Downloader</h1>
          <p>Download entire playlists or songs from Suno AI</p>
        </div>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              className="input"
              placeholder="Enter Suno playlist or song URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="button"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Download'}
            </button>
          </div>
        </form>
        
        {jobStatus && (
          <div className="progress-container">
            <div className="progress-header">
              <span className="progress-title">
                {jobStatus.playlistName || 'Download'}
              </span>
              <span className={`progress-status ${jobStatus.status}`}>
                {jobStatus.status}
              </span>
            </div>
            
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${jobStatus.progress.total > 0
                    ? (jobStatus.progress.completed / jobStatus.progress.total) * 100
                    : 0}%`
                }}
              />
            </div>
            
            <div className="progress-stats">
              <span>{jobStatus.progress.completed} / {jobStatus.progress.total} songs</span>
              <span>{jobStatus.progress.failed > 0 && `${jobStatus.progress.failed} failed`}</span>
            </div>
            
            {jobStatus.progress.currentSong && (
              <div className="current-song">
                Downloading: {jobStatus.progress.currentSong}
              </div>
            )}
          </div>
        )}
        
        {jobStatus?.status === 'completed' && (
          <div className="download-section">
            {jobStatus.shareCode && (
              <>
                <div className="share-link">
                  <input
                    type="text"
                    value={getShareLink()}
                    readOnly
                  />
                  <button
                    className="copy-button"
                    onClick={copyToClipboard}
                  >
                    Copy
                  </button>
                </div>
                
                {jobStatus.expiresAt && (
                  <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
                    Link expires: {new Date(jobStatus.expiresAt).toLocaleString()}
                  </p>
                )}
              </>
            )}
            
            <a
              href={`${API_URL}/api/download/${jobStatus.jobId}/download`}
              className="download-button"
            >
              Download ZIP
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
