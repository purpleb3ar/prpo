import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

const ensureErrorMessage = (errorResponse: any) => {
  if (errorResponse.message) {
    return Array.isArray(errorResponse.message)
      ? errorResponse.message[0]
      : errorResponse.message;
  }

  return "Something went wrong";
};

const ADD_COLLABORATOR_ROUTE = "https://prpo.purplebear.io/puzzles/invite";
// const ADD_COLLABORATOR_ROUTE = "http://localhost:9001/puzzles/invite";

const Invite: React.FC = () => {
  const navigate = useNavigate();
  const { key } = useParams();

  const addCollaborator = async () => {
    const url = `${ADD_COLLABORATOR_ROUTE}/${key}`;

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      const puzzle = await response.json();
      navigate(`/playground/${puzzle.id}`);
      toast.success("Joined puzzle successfully.");
    } else {
      const errorResponse = await response.json();
      toast.error(ensureErrorMessage(errorResponse));
      navigate("/app");
    }
  };

  useEffect(() => {
    addCollaborator();
  }, []);

  return <div>Join puzzle</div>;
};

export default Invite;
