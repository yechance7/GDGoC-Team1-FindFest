"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import EventList from "@/components/event-list"
import LoginModal from "@/components/login-modal"
import { eventsData } from "@/lib/events-data"
import { useAuth } from "@/contexts/auth-context"

export default function LikedPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [likedEvents, setLikedEvents] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Redirect to home if not logged in
  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  // Load liked events from localStorage
  useEffect(() => {
    const savedLikes = localStorage.getItem("likedEvents")
    if (savedLikes) {
      setLikedEvents(JSON.parse(savedLikes))
    }
  }, [])

  const handleLogout = () => {
    logout()
    setLikedEvents([])
    localStorage.removeItem("likedEvents")
    router.push("/")
  }

  const handleToggleLike = (eventId: string) => {
    setLikedEvents((prev) => {
      const updated = prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
      localStorage.setItem("likedEvents", JSON.stringify(updated))
      return updated
    })
  }

  const handleNavigateLiked = () => {
    // Already on liked page, do nothing
  }

  const likedEventsList = eventsData
    .filter((event) => likedEvents.includes(event.id))
    .filter(
      (event) =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()),
    )

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isLoggedIn={!!user}
        username={user?.username}
        onLogin={() => setShowLoginModal(true)}
        onLogout={handleLogout}
        onNavigateLiked={handleNavigateLiked}
      />

      {showLoginModal && (
        <LoginModal
          onLogin={() => setShowLoginModal(false)}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">내가 찜한 행사들</h2>
          <p className="text-slate-400">
            {likedEventsList.length} event{likedEventsList.length !== 1 ? "s" : ""} saved
          </p>
        </div>

        <EventList
          events={likedEventsList}
          likedEvents={likedEvents}
          onToggleLike={handleToggleLike}
          isLoggedIn={!!user}
        />
      </div>
    </main>
  )
}
