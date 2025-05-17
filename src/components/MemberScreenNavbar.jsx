import React, { useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const MemberScreenNavbar = ({
  setIsOpenList,
  setShowW9Form,
  setShowMyProfile,
  isOpenList,
  user,
}) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

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
                className="absolute right-4 mt-32 w-42 bg-white border border-gray-200 shadow-lg rounded-md"
              >
                <div className="flex flex-col">
                  <button
                    className="text-[15px] px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => setShowW9Form(true)}
                  >
                    W9 Form
                  </button>
                  <button
                    className="text-[15px] px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => setShowMyProfile(true)}
                  >
                    My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-[15px] px-4 py-2 hover:bg-gray-100 cursor-pointer"
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
    </div>
  );
};

export default MemberScreenNavbar;
