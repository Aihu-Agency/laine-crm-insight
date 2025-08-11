
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginPage from "@/components/LoginPage";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/dashboard", { replace: true });
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/dashboard", { replace: true });
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div>
      <LoginPage />
    </div>
  );
};

export default Index;
