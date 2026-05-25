import { Link, useNavigate } from "react-router-dom";
import { AuthHeader, AuthFooter, SignupForm } from "../../components/auth";
import Seo from "../../components/seo";

const Signup = () => {
  const navigate = useNavigate();

  return (
    <>
      <Seo
        title="Sign Up - ArtCraft"
        description="Create your ArtCraft account."
      />
      <AuthHeader title="Create an Account" subtitle="Join thousands of creators" />

      <SignupForm onSuccess={() => navigate("/welcome")} signupSource="artcraft" />

      <AuthFooter>
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-primary transition-colors hover:text-primary-400"
        >
          Log in
        </Link>
      </AuthFooter>
    </>
  );
};

export default Signup;
