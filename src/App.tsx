import { useState, useEffect } from "react";
// 컴포넌트 경로 수정: App.tsx와 components 폴더는 src 폴더 안에서 같은 위치에 있으므로 './'가 맞습니다.
import { PhoneConsultationForm } from "./components/PhoneConsultationForm";
import { OnlineAnalysisForm } from "./components/OnlineAnalysisForm";
import { AdminPanel } from "./components/AdminPanel";
import { Button } from "./components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import {
  Phone,
  BarChart3,
  ArrowDown,
  Zap,
  Smartphone,
  Shield,
  Briefcase,
  Building2,
  Home,
} from "lucide-react";
// 이미지 경로 수정: App.tsx(src 폴더 안)에서 assets(src 폴더 안)를 바라보므로 './'가 맞습니다.
import consultantImage from "./assets/a6f94ab0ce1420152da6a007d5f5c299abc96741.png";
import insuranceComparisonImage from "./assets/103b05b4123991615d1e49ebbf7bfdcf94d0f112.png";

export default function App() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminModeEnabled, setAdminModeEnabled] =
    useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showPasswordDialog, setShowPasswordDialog] =
    useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isAuthenticating, setIsAuthenticating] =
    useState(false);
  const [activeTab, setActiveTab] = useState<
    "phone" | "online"
  >("phone");

  const ADMIN_PASSWORD = "1q2w3e4r!!";

  // 키보드 단축키로 관리자 모드 활성화 (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.ctrlKey &&
        event.shiftKey &&
        event.key === "A"
      ) {
        event.preventDefault();
        setAdminModeEnabled((prev) => !prev);
        if (!adminModeEnabled) {
          console.log("관리자 모드가 활성화되었습니다.");
        } else {
          console.log("관리자 모드가 비활성화되었습니다.");
          setShowAdmin(false);
          setShowPasswordDialog(false);
          setPassword("");
          setPasswordError("");
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () =>
      document.removeEventListener("keydown", handleKeyDown);
  }, [adminModeEnabled]);

  // 숨겨진 클릭 방법 - 로고 영역을 5번 연속 클릭
  const handleHiddenClick = () => {
    const currentTime = Date.now();

    // 3초 이내에 클릭해야 연속으로 인정
    if (currentTime - lastClickTime > 3000) {
      setClickCount(1);
    } else {
      setClickCount((prev) => prev + 1);
    }

    setLastClickTime(currentTime);

    // 5번 연속 클릭 시 관리자 모드 활성화
    if (clickCount >= 4) {
      setAdminModeEnabled(true);
      setClickCount(0);
      console.log(
        "숨겨진 방법으로 관리자 모드가 활성화되었습니다.",
      );
    }
  };

  // 관리자 패널 버튼 클릭 - 비밀번호 다이얼로그 표시
  const handleAdminPanelClick = () => {
    setShowPasswordDialog(true);
    setPassword("");
    setPasswordError("");
  };

  // 비밀번호 인증
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setPasswordError("");

    // 약간의 지연을 두어 실제 인증 과정처럼 보이게 함
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        setShowPasswordDialog(false);
        setShowAdmin(true);
        setPassword("");
        console.log("관리자 패널에 성공적으로 접근했습니다.");
      } else {
        setPasswordError("비밀번호가 올바르지 않습니다.");
        setPassword("");
      }
      setIsAuthenticating(false);
    }, 500);
  };

  // 비밀번호 다이얼로그 닫기
  const handlePasswordDialogClose = () => {
    setShowPasswordDialog(false);
    setPassword("");
    setPasswordError("");
    setIsAuthenticating(false);
  };

  if (showAdmin) {
    return (
      <div className="min-h-screen bg-background p-4">
        {/* 관리자 패널 헤더 */}
        <div className="w-full max-w-7xl mx-auto mb-6 flex items-center justify-between">
          <Button
            onClick={() => setShowAdmin(false)}
            variant="outline"
            size="sm"
          >
            ← 메인 화면으로 돌아가기
          </Button>

          <Button
            onClick={() => {
              setAdminModeEnabled(false);
              setShowAdmin(false);
            }}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            관리자 모드 종료
          </Button>
        </div>

        {/* 관리자 패널 */}
        <AdminPanel />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#1e3a8a] via-[#1e40af] to-[#1d4ed8] p-4">
      {/* 배경 빛 효과 및 패턴 */}
      <div className="absolute inset-0">
        {/* 메인 스포트라이트 효과 */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 800px 600px at 50% 40%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
              radial-gradient(ellipse 600px 400px at 30% 60%, rgba(147, 197, 253, 0.2) 0%, transparent 60%),
              radial-gradient(ellipse 500px 300px at 70% 30%, rgba(96, 165, 250, 0.15) 0%, transparent 50%)
            `,
          }}
        />

        {/* 상단 빛 번짐 효과 */}
        <div
          className="absolute top-0 left-0 right-0 h-1/3"
          style={{
            background: `linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 30%, transparent 100%)`,
          }}
        />

        {/* 하단 그림자 효과 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1/4"
          style={{
            background: `linear-gradient(0deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 50%, transparent 100%)`,
          }}
        />

        {/* 좌우 비네팅 효과 */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(90deg, rgba(0, 0, 0, 0.2) 0%, transparent 20%, transparent 80%, rgba(0, 0, 0, 0.2) 100%),
              linear-gradient(0deg, rgba(0, 0, 0, 0.1) 0%, transparent 15%, transparent 85%, rgba(0, 0, 0, 0.1) 100%)
            `,
          }}
        />

        {/* 중앙 하이라이트 */}
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "400px",
            height: "200px",
            background:
              "radial-gradient(ellipse, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 40%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* 측면 빛 효과 */}
        <div
          className="absolute top-1/4 left-0"
          style={{
            width: "300px",
            height: "400px",
            background:
              "radial-gradient(ellipse 150px 200px, rgba(147, 197, 253, 0.15) 0%, transparent 60%)",
            transform: "rotate(-15deg)",
          }}
        />

        <div
          className="absolute top-1/3 right-0"
          style={{
            width: "250px",
            height: "350px",
            background:
              "radial-gradient(ellipse 125px 175px, rgba(96, 165, 250, 0.12) 0%, transparent 60%)",
            transform: "rotate(20deg)",
          }}
        />
      </div>

      {/* 기존 패턴들 */}
      <div className="absolute inset-0 opacity-8">


        {/* 대각선 그리드 */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(45deg, rgba(255,255,255,0.08) 1px, transparent 1px),
              linear-gradient(-45deg, rgba(255,255,255,0.08) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* 보험 관련 아이콘들 */}
        <div className="absolute top-1/4 left-1/8 transform -translate-x-1/2 -translate-y-1/2 opacity-40">
          <div className="flex items-center justify-center w-16 h-16 bg-purple-500/30 backdrop-blur-sm rounded-full border border-purple-400/20">
            <Shield size={32} className="text-purple-200" />
          </div>
        </div>

        <div className="absolute top-3/4 left-1/4 transform -translate-x-1/2 translate-y-1/2 opacity-40">
          <div className="flex items-center justify-center w-14 h-14 bg-amber-500/30 backdrop-blur-sm rounded-full border border-amber-400/20">
            <Briefcase size={28} className="text-amber-200" />
          </div>
        </div>

        <div className="absolute top-1/2 right-1/8 transform translate-x-1/2 -translate-y-1/2 opacity-40">
          <div className="flex items-center justify-center w-12 h-12 bg-rose-500/30 backdrop-blur-sm rounded-full border border-rose-400/20">
            <Building2 size={24} className="text-rose-200" />
          </div>
        </div>

        <div className="absolute bottom-1/4 right-1/4 transform translate-x-1/2 translate-y-1/2 opacity-40">
          <div className="flex items-center justify-center w-14 h-14 bg-teal-500/30 backdrop-blur-sm rounded-full border border-teal-400/20">
            <Home size={28} className="text-teal-200" />
          </div>
        </div>

        {/* 중앙 구분선 */}
        <div
          className="absolute top-0 left-1/2 w-px h-full transform -translate-x-1/2"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.2) 20%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.2) 80%, transparent 100%)",
            boxShadow: "0 0 20px rgba(255,255,255,0.1)",
          }}
        ></div>
      </div>

      {/* 관리자 패널 접근 버튼 */}
      {adminModeEnabled && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <div className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded">
            관리자 모드
          </div>
          <Button
            onClick={handleAdminPanelClick}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            관리자 패널
          </Button>
        </div>
      )}

      {/* 비밀번호 입력 다이얼로그 */}
      <Dialog
        open={showPasswordDialog}
        onOpenChange={handlePasswordDialogClose}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              🔐 관리자 인증
            </DialogTitle>
            <DialogDescription>
              관리자 패널에 접근하려면 비밀번호를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handlePasswordSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="admin-password">비밀번호</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="관리자 비밀번호를 입력하세요"
                className="w-full"
                disabled={isAuthenticating}
                autoFocus
              />
              {passwordError && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  ⚠️ {passwordError}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePasswordDialogClose}
                disabled={isAuthenticating}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={!password.trim() || isAuthenticating}
                className="min-w-[80px]"
              >
                {isAuthenticating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    인증중...
                  </div>
                ) : (
                  "확인"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 숨겨진 관리자 접근 영역 */}
      <div
        className="absolute top-4 left-4 z-20 w-16 h-16 cursor-default opacity-0"
        onClick={handleHiddenClick}
      ></div>

      {/* 메인 컨텐츠 영역 */}
      <div className="relative z-10 w-full max-w-7xl mx-auto pt-6 lg:pt-8">
        {/* 상단 제목 */}
        <div className="text-center mb-8 lg:mb-12">
          <h1
            className="text-white text-4xl lg:text-5xl leading-relaxed"
            style={{
              textShadow:
                "0 2px 4px rgba(0,0,0,0.8), 0 4px 8px rgba(0,0,0,0.6), 0 8px 16px rgba(0,0,0,0.4), 0 16px 32px rgba(0,0,0,0.3), 0 0 40px rgba(255,255,255,0.2), 0 0 80px rgba(255,255,255,0.1)",
            }}
          >
            <span className="text-orange-500 font-bold">
              치아보험 전문가
            </span>
            <br />
            1:1 무료 매칭 신청
          </h1>
        </div>

        {/* 데스크톱 레이아웃 */}
        <div className="hidden lg:block">
          <div className="flex items-start justify-center gap-8 lg:gap-12 mb-8">
            {/* 왼쪽 폼 */}
            <div className="flex-1 flex flex-col items-center space-y-6">
              <div className="text-center space-y-2">
                <h2
                  className="text-white text-3xl leading-relaxed flex items-center justify-center gap-3"
                  style={{
                    textShadow:
                      "0 2px 10px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.1)",
                  }}
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full shadow-lg">
                    <Phone size={24} className="text-white" />
                  </div>
                  전화 상담
                </h2>
                <p className="text-white/80 text-lg leading-relaxed">
                  전문가와 직접 통화하며 상담받고 싶은 분
                </p>
              </div>
              <PhoneConsultationForm title="아래 이미지 파일 참조." />
            </div>

            {/* 중앙 구분자 */}
            <div className="w-px h-96 bg-white/20 relative self-center">
              <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/10 rounded-full p-3"
                style={{
                  boxShadow:
                    "0 0 30px rgba(255,255,255,0.2), inset 0 0 20px rgba(255,255,255,0.1)",
                }}
              >
                <div className="flex items-center justify-center w-8 h-8 bg-yellow-500/80 rounded-full">
                  <Zap size={16} className="text-white" />
                </div>
              </div>
            </div>

            {/* 오른쪽 폼 */}
            <div className="flex-1 flex flex-col items-center space-y-6">
              <div className="text-center space-y-2">
                <h2
                  className="text-white text-3xl leading-relaxed flex items-center justify-center gap-3"
                  style={{
                    textShadow:
                      "0 2px 10px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.1)",
                  }}
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-emerald-500 rounded-full shadow-lg">
                    <BarChart3
                      size={24}
                      className="text-white"
                    />
                  </div>
                  온라인 분석
                </h2>
                <p className="text-white/80 text-lg leading-relaxed">
                  온라인으로 빠르고 간편하게 비교분석 받고 싶은
                  분
                </p>
              </div>
              <OnlineAnalysisForm title="아래 이미지 파일 참조." />
            </div>
          </div>

          {/* 화살표 및 이미지 영역 */}
          <div className="flex items-center justify-center gap-8 lg:gap-12 mb-8">
            <div className="flex-1 flex justify-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-500 rounded-full shadow-lg animate-bounce">
                <ArrowDown size={24} className="text-white" />
              </div>
            </div>
            <div className="w-px h-16 bg-transparent"></div>
            <div className="flex-1 flex justify-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-500 rounded-full shadow-lg animate-bounce">
                <ArrowDown size={24} className="text-white" />
              </div>
            </div>
          </div>

          <div className="flex items-start justify-center gap-8 lg:gap-12">
            <div className="flex-1 flex flex-col items-center space-y-4">
              <h3
                className="text-white/90 text-lg"
                style={{
                  textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                }}
              >
                <span className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full">
                    <Phone size={14} className="text-white" />
                  </div>
                  전화 상담 예시
                </span>
              </h3>
              <div
                className="w-full max-w-md bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 min-h-[400px] flex items-center justify-center overflow-hidden"
                style={{
                  boxShadow: `
                    0 25px 50px -12px rgba(0, 0, 0, 0.4),
                    0 20px 25px -5px rgba(0, 0, 0, 0.2),
                    0 10px 10px -5px rgba(0, 0, 0, 0.15),
                    0 4px 6px -2px rgba(0, 0, 0, 0.1),
                    0 0 0 1px rgba(255, 255, 255, 0.05),
                    inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
                  `,
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={consultantImage}
                    alt="전화 상담사 예시"
                    className="w-full h-auto max-w-sm rounded-3xl"
                    style={{
                      filter: "brightness(1.1) contrast(1.05)",
                      boxShadow:
                        "0 8px 25px rgba(0, 0, 0, 0.3)",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="w-px h-96 bg-white/20 relative self-center">
              <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/10 rounded-full p-3"
                style={{
                  boxShadow:
                    "0 0 30px rgba(255,255,255,0.2), inset 0 0 20px rgba(255,255,255,0.1)",
                }}
              >
                <div className="flex items-center justify-center w-6 h-6 bg-blue-500/80 rounded-full">
                  <Smartphone
                    size={14}
                    className="text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center space-y-4">
              <h3
                className="text-white/90 text-lg"
                style={{
                  textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                }}
              >
                <span className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-emerald-500 rounded-full">
                    <BarChart3
                      size={14}
                      className="text-white"
                    />
                  </div>
                  온라인 분석 예시
                </span>
              </h3>
              <div
                className="w-full max-w-md bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 min-h-[400px] flex items-center justify-center overflow-hidden"
                style={{
                  boxShadow: `
                    0 25px 50px -12px rgba(0, 0, 0, 0.4),
                    0 20px 25px -5px rgba(0, 0, 0, 0.2),
                    0 10px 10px -5px rgba(0, 0, 0, 0.15),
                    0 4px 6px -2px rgba(0, 0, 0, 0.1),
                    0 0 0 1px rgba(255, 255, 255, 0.05),
                    inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
                  `,
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={insuranceComparisonImage}
                    alt="보험 보장 비교 분석 예시"
                    className="w-full h-auto max-w-sm rounded-3xl"
                    style={{
                      filter: "brightness(1.15) contrast(1.1)",
                      boxShadow:
                        "0 8px 25px rgba(0, 0, 0, 0.3)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 모바일 레이아웃 */}
        <div className="lg:hidden space-y-8">
          <div className="flex justify-center">
            <div className="flex bg-white/10 backdrop-blur-sm rounded-full p-1 border border-white/20">
              <Button
                onClick={() => setActiveTab("phone")}
                className={`w-38 flex items-center justify-center space-x-2 px-4 py-3 rounded-full transition-all whitespace-nowrap ${
                  activeTab === "phone"
                    ? "bg-[#f59e0b] text-white shadow-lg border border-[#f59e0b] hover:bg-[#d97706]"
                    : "text-white/80 hover:text-white hover:bg-white/5 border border-white/30 hover:border-white/50 bg-transparent"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full transition-all ${
                    activeTab === "phone"
                      ? "bg-white/20"
                      : "bg-blue-500/80"
                  }`}
                >
                  <Phone size={14} className="text-white" />
                </div>
                <span className="text-base">전화 상담</span>
              </Button>
              <Button
                onClick={() => setActiveTab("online")}
                className={`w-38 flex items-center justify-center space-x-2 px-4 py-3 rounded-full transition-all whitespace-nowrap ${
                  activeTab === "online"
                    ? "bg-[#f59e0b] text-white shadow-lg border border-[#f59e0b] hover:bg-[#d97706]"
                    : "text-white/80 hover:text-white hover:bg-white/5 border border-white/30 hover:border-white/50 bg-transparent"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full transition-all ${
                    activeTab === "online"
                      ? "bg-white/20"
                      : "bg-emerald-500/80"
                  }`}
                >
                  <BarChart3 size={14} className="text-white" />
                </div>
                <span className="text-base">온라인 분석</span>
              </Button>
            </div>
          </div>

          {activeTab === "phone" && (
            <div className="flex flex-col items-center space-y-4">
              <div className="text-center space-y-2">
                <h2
                  className="text-white text-2xl leading-relaxed flex items-center justify-center gap-3"
                  style={{
                    textShadow:
                      "0 2px 10px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.1)",
                  }}
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full shadow-lg">
                    <Phone size={20} className="text-white" />
                  </div>
                  전화 상담
                </h2>
                <p className="text-white/80 text-lg leading-relaxed">
                  전문가와 직접 통화하며 상담받고 싶은 분
                </p>
              </div>
              <PhoneConsultationForm title="아래 이미지 파일 참조." />

              <div className="flex items-center justify-center w-10 h-10 bg-orange-500 rounded-full shadow-lg animate-bounce">
                <ArrowDown size={20} className="text-white" />
              </div>

              <div
                className="w-full max-w-md bg-white/10 backdrop-blur-sm rounded-3xl p-4 border border-white/20 min-h-[300px] flex items-center justify-center overflow-hidden"
                style={{
                  boxShadow: `
                    0 25px 50px -12px rgba(0, 0, 0, 0.4),
                    0 20px 25px -5px rgba(0, 0, 0, 0.2),
                    0 10px 10px -5px rgba(0, 0, 0, 0.15),
                    0 4px 6px -2px rgba(0, 0, 0, 0.1),
                    0 0 0 1px rgba(255, 255, 255, 0.05),
                    inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
                  `,
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={consultantImage}
                    alt="전화 상담사 예시"
                    className="w-full h-auto max-w-xs rounded-3xl"
                    style={{
                      filter: "brightness(1.1) contrast(1.05)",
                      boxShadow:
                        "0 8px 25px rgba(0, 0, 0, 0.3)",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "online" && (
            <div className="flex flex-col items-center space-y-4">
              <div className="text-center space-y-2">
                <h2
                  className="text-white text-2xl leading-relaxed flex items-center justify-center gap-3"
                  style={{
                    textShadow:
                      "0 2px 10px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.1)",
                  }}
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-emerald-500 rounded-full shadow-lg">
                    <BarChart3
                      size={20}
                      className="text-white"
                    />
                  </div>
                  온라인 분석
                </h2>
                <p className="text-white/80 text-lg leading-relaxed">
                  온라인으로 빠르고 간편하게 비교분석 받고 싶은
                  분
                </p>
              </div>
              <OnlineAnalysisForm title="아래 이미지 파일 참조." />

              <div className="flex items-center justify-center w-10 h-10 bg-orange-500 rounded-full shadow-lg animate-bounce">
                <ArrowDown size={20} className="text-white" />
              </div>

              <div
                className="w-full max-w-md bg-white/10 backdrop-blur-sm rounded-3xl p-4 border border-white/20 min-h-[300px] flex items-center justify-center overflow-hidden"
                style={{
                  boxShadow: `
                    0 25px 50px -12px rgba(0, 0, 0, 0.4),
                    0 20px 25px -5px rgba(0, 0, 0, 0.2),
                    0 10px 10px -5px rgba(0, 0, 0, 0.15),
                    0 4px 6px -2px rgba(0, 0, 0, 0.1),
                    0 0 0 1px rgba(255, 255, 255, 0.05),
                    inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
                  `,
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={insuranceComparisonImage}
                    alt="보험 보장 비교 분석 예시"
                    className="w-full h-auto max-w-xs rounded-3xl"
                    style={{
                      filter: "brightness(1.15) contrast(1.1)",
                      boxShadow:
                        "0 8px 25px rgba(0, 0, 0, 0.3)",
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
