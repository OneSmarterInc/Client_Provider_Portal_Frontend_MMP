import MyContext from "./MyContext";

const MyProvider = ({ children }) => {
  // const api = "http://127.0.0.1:8000";

  const api = "http://170.249.90.216:3181";

  return (
    <MyContext.Provider
      value={{
        api
      }}
    >
      {children}
    </MyContext.Provider>
  );
};
export default MyProvider;
