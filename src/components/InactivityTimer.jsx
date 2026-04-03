import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const COUNTDOWN_SECONDS = 60; // 60 second countdown after alert

const InactivityTimer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAlert, setShowAlert] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const idleTimerRef = useRef(null);
  const countdownRef = useRef(null);

  const isProvider = () => {
    try {
      const token = localStorage.getItem("authToken");
      const user = JSON.parse(localStorage.getItem("user"));
      return token && user && !user.is_admin && !user.is_guest;
    } catch {
      return false;
    }
  };

  // Public routes where timer should not run
  const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/new-provider-register"];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  const clearAllTimers = useCallback(() => {
    clearTimeout(idleTimerRef.current);
    clearInterval(countdownRef.current);
  }, []);

  const logout = useCallback(() => {
    clearAllTimers();
    setShowAlert(false);
    setCountdown(COUNTDOWN_SECONDS);
    localStorage.clear();
    navigate("/");
  }, [navigate, clearAllTimers]);

  const resetTimer = useCallback(() => {
    if (!isProvider() || isPublicRoute) return;

    // If alert is showing, dismiss it on activity
    if (showAlert) {
      setShowAlert(false);
      setCountdown(COUNTDOWN_SECONDS);
      clearInterval(countdownRef.current);
    }

    // Reset the idle timer
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (isProvider()) {
        setShowAlert(true);
      }
    }, IDLE_TIMEOUT);
  }, [showAlert, isPublicRoute]);

  // Start countdown when alert appears
  useEffect(() => {
    if (showAlert && isProvider()) {
      setCountdown(COUNTDOWN_SECONDS);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            logout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(countdownRef.current);
  }, [showAlert, logout]);

  // Clear everything when navigating to public routes (e.g. after logout)
  useEffect(() => {
    if (isPublicRoute) {
      clearAllTimers();
      setShowAlert(false);
      setCountdown(COUNTDOWN_SECONDS);
    }
  }, [isPublicRoute, clearAllTimers]);

  // Listen for user activity
  useEffect(() => {
    if (!isProvider() || isPublicRoute) return;

    const events = ["click", "mousemove", "keydown", "scroll", "touchstart"];

    const handleActivity = () => resetTimer();

    events.forEach((event) =>
      document.addEventListener(event, handleActivity)
    );

    // Start initial timer
    idleTimerRef.current = setTimeout(() => {
      if (isProvider()) {
        setShowAlert(true);
      }
    }, IDLE_TIMEOUT);

    return () => {
      events.forEach((event) =>
        document.removeEventListener(event, handleActivity)
      );
      clearTimeout(idleTimerRef.current);
      clearInterval(countdownRef.current);
    };
  }, [resetTimer, isPublicRoute]);

  if (!showAlert || isPublicRoute) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-7 h-7 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Session Timeout Warning
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          You have been inactive for 5 minutes. You will be automatically logged
          out in:
        </p>

        <div className="text-4xl font-bold text-red-500 mb-4 font-mono">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </div>

        <p className="text-xs text-gray-400">
          Click anywhere on the page to stay logged in
        </p>
      </div>
    </div>
  );
};

export default InactivityTimer;
