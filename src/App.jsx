import React, { useContext } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./components/Register";
import ProviderLogin from "./components/ProviderLogin";
import AccountVerification from "./components/AccountVerification";
import MemberScreen from "./components/MemberScreen";
import { ToastContainer } from "react-toastify";
import "./output.css";
import AdminValidations from "./components/AdminValidations";
import Watchlist from "./components/Watchlist";
import FirstVerificationScreen from "./components/FirstVerificationScreen";
import LoginLogsTable from "./components/LoginLogsTable";
import MyContext from "./ContextApi/MyContext";
import ViewEOBDownload from "./components/ViewEOBDownload";
import ForgotPasswordFlow from "./components/ForgotPasswordFlow";
import NewProviderRegister from "./components/NewProviderRegister";
import AdminNewProviderAdd from "./components/AdminNewProviderAdd";

const App = () => {
  const { setIsEOBOpen } = useContext(MyContext);
  const EOB_Claim_No = localStorage.getItem("EOB_Claim_No");
  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<ProviderLogin />} />
        <Route path="/login" element={<ProviderLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<FirstVerificationScreen />} />
        <Route path="/members" element={<MemberScreen />} />
        <Route path="/admin" element={<AdminValidations />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/loginlogs" element={<LoginLogsTable />} />
        {/* Modals to Full Screens */}
        <Route
          path="/eob-details/:claim_no_from_params"
          element={
            <ViewEOBDownload
              isOpen={true}
              onClose={() => setIsEOBOpen(false)}
              claim_no={EOB_Claim_No}
            />
          }
        />
        <Route path="/forgot-password" element={<ForgotPasswordFlow />} />
        <Route
          path="/new-provider-register"
          element={<NewProviderRegister />}
        />
        <Route
          path="/admin-new-prov-request"
          element={<AdminNewProviderAdd />}
        />
      </Routes>
    </Router>
  );
};

export default App;
