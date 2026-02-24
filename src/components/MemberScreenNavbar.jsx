import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProviderSwitcher from "./ProviderSwitcher";
import ProviderSettings from "./ProviderSettings";

const MemberScreenNavbar = ({
  setIsOpenList,
  setShowW9Form,
  setShowMyProfile,
  isOpenList,
  user,
}) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [showProviderSettings, setShowProviderSettings] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // Close outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpenList(false);
      }
    };

    if (isOpenList) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpenList, setIsOpenList]);

  return (
    <div>
      <div className="w-full bg-transparent">
        <div className="flex items-center justify-end pl-4 pr-4 pb-0 gap-4">
          <div className="flex items-center gap-4">
            <h3 className="font-inter text-sm text-black-700">
              Welcome, {user?.email}!
            </h3>
            <ProviderSwitcher />
            <button onClick={() => navigate("/watchlist")}>Watchlist</button>
            <img
              src="/images/Header/img-11.png"
              alt="Profile"
              className="w-10 cursor-pointer"
              aria-label="User profile"
              onClick={() => setIsOpenList(!isOpenList)}
            />

            {/* Dropdown List */}
            {isOpenList && (
              <div
                ref={dropdownRef}
                className="absolute right-4 mt-44 w-48 bg-white border border-gray-200 shadow-lg rounded-md"
              >
                <div className="flex flex-col">
                  <button
                    className="text-[15px] px-4 py-2 hover:bg-gray-100 cursor-pointer text-left"
                    onClick={() => setShowMyProfile(true)}
                  >
                    My Profile
                  </button>
                  <button
                    className="text-[15px] px-4 py-2 hover:bg-gray-100 cursor-pointer text-left"
                    onClick={() => {
                      setShowProviderSettings(true);
                      setIsOpenList(false);
                    }}
                  >
                    Manage Providers
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-[15px] px-4 py-2 hover:bg-gray-100 cursor-pointer text-left"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}

            <div onClick={handleLogout}>
              <img
                className="w-6 cursor-pointer"
                src="/images/Header/Vector.png"
                alt="Logout"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>

      <ProviderSettings
        isOpen={showProviderSettings}
        onClose={() => setShowProviderSettings(false)}
      />
    </div>
  );
};

export default MemberScreenNavbar;
