import TopAppBar from "@/src/components/TopAppBar";
import BottomNavBar from "@/src/components/BottomNavBar";
import { ArrowRight, Radio, Hourglass, CheckCircle2, Info, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuiz } from "@/src/context/QuizContext";
import { cn } from "@/src/lib/utils";

export default function StudentJoin() {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get("code") || "";

  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState("");
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // ✅ LOCAL STATE FOR QUIZ (IMPORTANT FIX)
  const [localQuiz, setLocalQuiz] = useState<any>(null);

  const { findQuizByRoomCode, joinQuiz, participants, isRollAllowed } = useQuiz();

  const navigate = useNavigate();

  const [history] = useState(() =>
    JSON.parse(localStorage.getItem("quizHistory") || "[]")
  );

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      validateCode(initialCode);
    }
  }, [initialCode]);

  // ✅ FIXED VALIDATION
  const validateCode = async (inputCode: string) => {
    const cleanCode = inputCode.replace(/[^A-Z0-9]/gi, "");

    if (cleanCode.length === 6) {
      setIsValidating(true);

      const found = await findQuizByRoomCode(cleanCode); // ✅ use cleanCode

      if (found) {
        setLocalQuiz(found); // ✅ STORE QUIZ
        setIsCodeValid(true);
        setError("");
      } else {
        setLocalQuiz(null);
        setIsCodeValid(false);
        setError("Invalid room code");
      }

      setIsValidating(false);
    } else {
      setIsCodeValid(false);
      setError("");
      setLocalQuiz(null);
    }
  };

  // ✅ FIXED JOIN
  const handleJoin = async () => {
    if (!code) {
      setError("Please enter a room code");
      return;
    }

    let targetQuiz = localQuiz;

    if (!isCodeValid || !targetQuiz) {
      setIsValidating(true);

      const found = await findQuizByRoomCode(code.replace(/[^A-Z0-9]/gi, ""));

      setIsValidating(false);

      if (!found) {
        setError("Invalid room code");
        return;
      }

      setLocalQuiz(found);
      setIsCodeValid(true);
      targetQuiz = found;
    }

    if (!name || !roll) {
      setError("Please enter your name and roll number");
      return;
    }

    // Roll validation
    if (targetQuiz.allowedRollPatterns?.length > 0) {
      if (!isRollAllowed(roll, targetQuiz.allowedRollPatterns)) {
        setError(
          `Allowed types: ${targetQuiz.allowedRollPatterns.join(", ")}`
        );
        return;
      }
    }

    try {
      const joined = await joinQuiz({ name, roll }, targetQuiz);

      if (!joined) {
        setError("Quiz has ended or is inactive.");
        return;
      }

      const p = participants.find((part) => part.roll === roll);

      if (p?.status === "Submitted") {
        navigate("/score");
      } else {
        navigate("/quiz");
      }
    } catch (err) {
      console.error("Join error:", err);
      setError("Something went wrong. Try again.");
    }
  };

  return (
    <div className="bg-surface min-h-screen pb-24 flex flex-col">
      <TopAppBar />

      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">

          <h2 className="text-4xl font-bold mb-6">Join Quiz Room</h2>

          <input
            value={code}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              setCode(val);
              validateCode(val);
            }}
            placeholder="000-000"
            className="w-full text-3xl text-center mb-6"
          />

          {isValidating && <Loader2 className="animate-spin" />}

          {isCodeValid && localQuiz && (
            <div className="mb-4 text-green-600">
              Room Found: {localQuiz.title}
            </div>
          )}

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full mb-4"
          />

          <input
            value={roll}
            onChange={(e) => setRoll(e.target.value)}
            placeholder="Roll"
            className="w-full mb-4"
          />

          {error && <div className="text-red-500">{error}</div>}

          <button onClick={handleJoin} disabled={!isCodeValid}>
            Enter Quiz
          </button>
        </div>
      </main>

      <BottomNavBar />
    </div>
  );
}
