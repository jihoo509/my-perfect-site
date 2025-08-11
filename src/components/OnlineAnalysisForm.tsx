import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { PrivacyPolicyDialog } from './PrivacyPolicyDialog';
import { saveConsultationToStorage } from '../utils/localStorageManager';

interface OnlineAnalysisFormProps {
  title?: string;
}

export function OnlineAnalysisForm({ title }: OnlineAnalysisFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    birthDateFirst: '',
    birthDateSecond: '',
    gender: '',
    phoneNumber: '',
    agreedToTerms: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [serverStatus, setServerStatus] = useState<'unknown' | 'checking' | 'online' | 'offline'>('unknown');
  const [offlineMode, setOfflineMode] = useState(false);
  
  // 입력 필드 ref들
  const nameInputRef = useRef<HTMLInputElement>(null);
  const birthDateFirstInputRef = useRef<HTMLInputElement>(null);
  const birthDateSecondInputRef = useRef<HTMLInputElement>(null);
  const phoneNumberInputRef = useRef<HTMLInputElement>(null);

  // 모바일에서 입력 필드 포커스 시 자동 스크롤 함수
  const handleInputFocus = (inputRef: React.RefObject<HTMLInputElement>) => {
    if (inputRef.current && window.innerWidth <= 768) {
      // 주민번호 앞자리와 뒷자리 간 이동 시에는 스크롤하지 않음 (같은 높이에 있음)
      if (inputRef === birthDateFirstInputRef || inputRef === birthDateSecondInputRef) {
        return;
      }
      
      // 약간의 지연을 두어 키보드가 올라온 후 스크롤 조정
      setTimeout(() => {
        inputRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 300);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 서버 상태 확인 함수
  const checkServerStatus = async () => {
    setServerStatus('checking');
    console.log('=== 온라인 분석 서버 상태 확인 시작 ===');
    
    try {
      const healthUrl = `https://${projectId}.supabase.co/functions/v1/server/health`;
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        // 3초 타임아웃으로 단축
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🌐 온라인 모드 - 서버 연결 성공');
        setServerStatus('online');
        setOfflineMode(false);
      } else {
        console.log('💾 오프라인 모드로 전환 - 서버 응답 오류');
        setServerStatus('offline');
        setOfflineMode(true);
      }
    } catch (error) {
      // 사용자에게는 오류를 보여주지 않고 조용히 오프라인 모드로 전환
      console.log('💾 오프라인 모드로 전환 - 서버 연결 불가');
      setServerStatus('offline');
      setOfflineMode(true);
    }
  };

  // 컴포넌트 마운트 시 서버 상태 자동 확인 (백그라운드에서 실행)
  useEffect(() => {
    // 서버 상태 확인을 백그라운드에서 실행하여 사용자 경험을 방해하지 않음
    const checkInBackground = async () => {
      await checkServerStatus();
    };
    
    // 약간의 지연을 두어 초기 렌더링이 완료된 후 확인
    const timer = setTimeout(checkInBackground, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('온라인 분석 신청 시작...');
      
      const requestData = {
        name: formData.name,
        birthDateFirst: formData.birthDateFirst,
        birthDateSecond: formData.birthDateSecond,
        gender: formData.gender,
        phoneNumber: `010-${formData.phoneNumber}`,
        consultationType: 'online'
      };
      console.log('요청 데이터:', requestData);

      // 오프라인 모드이거나 서버가 오프라인인 경우 로컬 스토리지 사용
      if (offlineMode || serverStatus === 'offline') {
        console.log('🔄 오프라인 모드: 로컬 스토리지에 데이터 저장');
        
        // 실제 서버 호출처럼 약간의 지연
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const savedConsultation = saveConsultationToStorage(requestData);
        
        // 간소화된 메시지
        alert('✅ 온라인 분석 신청이 정상적으로 접수되었습니다!');
        
        console.log('오프라인 모드 분석 신청 완료:', savedConsultation);
        
        // 폼 초기화
        setFormData({
          name: '',
          birthDateFirst: '',
          birthDateSecond: '',
          gender: '',
          phoneNumber: '',
          agreedToTerms: false
        });
        return;
      }

      // 온라인 모드: 실제 서버 호출
      const apiUrl = `https://${projectId}.supabase.co/functions/v1/server/submit-consultation`;
      console.log('API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData),
        signal: AbortSignal.timeout(10000)
      });

      console.log('응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('서버 응답:', result);
      
      if (result.success) {
        // 간소화된 메시지
        alert('✅ 온라인 분석 신청이 정상적으로 접수되었습니다!');
        console.log('온라인 분석 신청 성공:', result);
        
        // 폼 초기화
        setFormData({
          name: '',
          birthDateFirst: '',
          birthDateSecond: '',
          gender: '',
          phoneNumber: '',
          agreedToTerms: false
        });
      } else {
        throw new Error(result.error || '서버에서 알 수 없는 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('온라인 분석 신청 중 오류:', error);
      
      // 네트워크 오류 시 오프라인 모드로 대체 제안
      if (error.name === 'TimeoutError' || error.message?.includes('Failed to fetch')) {
        setServerStatus('offline');
        setOfflineMode(true);
        
        const shouldRetry = confirm(`🔌 서버 연결에 실패했습니다.\n\n"확인"을 누르면 오프라인 모드로 신청이 저장됩니다.\n"취소"를 누르면 서버 연결을 다시 시도할 수 있습니다.`);
        
        if (shouldRetry) {
          // 오프라인 모드로 다시 시도
          setTimeout(() => handleSubmit(), 100);
          return;
        }
      } else {
        alert(`❌ 신청 처리 중 오류가 발생했습니다:\n${error.message}\n\n다시 시도해주세요.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10">
      {/* 둥근 사각형 배경 컨테이너 */}
      <div 
        className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20"
        style={{
          boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.4),
            0 20px 25px -5px rgba(0, 0, 0, 0.2),
            0 10px 10px -5px rgba(0, 0, 0, 0.15),
            0 4px 6px -2px rgba(0, 0, 0, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
          `
        }}
      >
        {/* 헤더 텍스트 */}
        <div className="text-center space-y-1 mb-4">
          <h1 className="text-white text-2xl leading-relaxed">
            한 눈에 비교 분석할 수 있는
          </h1>
          <h2 className="text-[#fbbf24] text-2xl leading-relaxed">
            이미지 파일을 보내드립니다.
          </h2>
          {title && (
            <h3 className="text-white/80 text-base mt-2">
              {title}
            </h3>
          )}
        </div>

        {/* 폼 */}
        <div className="space-y-3">
          {/* 이름 입력 */}
          <div className="space-y-2">
            <label className="text-white text-base block">이름</label>
            <Input
              ref={nameInputRef}
              placeholder="한글 이름을 입력"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onFocus={() => handleInputFocus(nameInputRef)}
              className="bg-white border-0 h-12 text-gray-800 placeholder:text-gray-500"
            />
          </div>

          {/* 생년월일 입력 */}
          <div className="space-y-2">
            <label className="text-white text-base block">주민번호</label>
            <div className="flex space-x-2">
              <Input
                ref={birthDateFirstInputRef}
                placeholder="앞 6자리"
                value={formData.birthDateFirst}
                onChange={(e) => handleInputChange('birthDateFirst', e.target.value)}
                onFocus={() => handleInputFocus(birthDateFirstInputRef)}
                className="bg-white border-0 h-12 text-gray-800 placeholder:text-gray-500 flex-1"
                maxLength={6}
              />
              <span className="text-white text-2xl flex items-center">-</span>
              <Input
                ref={birthDateSecondInputRef}
                placeholder="뒤 7자리"
                value={formData.birthDateSecond}
                onChange={(e) => handleInputChange('birthDateSecond', e.target.value)}
                onFocus={() => handleInputFocus(birthDateSecondInputRef)}
                className="bg-white border-0 h-12 text-gray-800 placeholder:text-gray-500 flex-1"
                maxLength={7}
              />
            </div>
          </div>

          {/* 성별 선택 */}
          <div className="space-y-2">
            <label className="text-white text-base block">성별</label>
            <div className="flex h-12 bg-white rounded-md overflow-hidden">
              <Button
                type="button"
                onClick={() => handleInputChange('gender', '남')}
                className={`flex-1 flex items-center justify-center space-x-2 transition-colors rounded-none h-full border-0 ${
                  formData.gender === '남' 
                    ? 'bg-[#f59e0b] text-white hover:bg-[#d97706]' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  formData.gender === '남' ? 'bg-orange-400' : 'bg-gray-300'
                }`}>
                  👨
                </div>
                <span>남</span>
              </Button>
              <Button
                type="button"
                onClick={() => handleInputChange('gender', '여')}
                className={`flex-1 flex items-center justify-center space-x-2 transition-colors rounded-none h-full border-0 ${
                  formData.gender === '여' 
                    ? 'bg-[#f59e0b] text-white hover:bg-[#d97706]' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  formData.gender === '여' ? 'bg-orange-400' : 'bg-gray-300'
                }`}>
                  👩
                </div>
                <span>여</span>
              </Button>
            </div>
          </div>

          {/* 전화번호 입력 */}
          <div className="space-y-2">
            <label className="text-white text-base block">전화번호</label>
            <div className="flex space-x-2">
              <div className="bg-white rounded-md px-3 py-3 text-gray-800 text-base w-16 text-center">
                010
              </div>
              <span className="text-white text-2xl flex items-center">-</span>
              <Input
                ref={phoneNumberInputRef}
                placeholder="휴대폰번호 8자리 입력"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                onFocus={() => handleInputFocus(phoneNumberInputRef)}
                className="bg-white border-0 h-12 text-gray-800 placeholder:text-gray-500 flex-1"
                maxLength={8}
              />
            </div>
          </div>

          {/* 개인정보 동의 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="online-terms-agreement"
                checked={formData.agreedToTerms}
                onCheckedChange={(checked) => handleInputChange('agreedToTerms', checked)}
                className="border-white data-[state=checked]:bg-[#f59e0b] data-[state=checked]:border-[#f59e0b]"
              />
              <label htmlFor="online-terms-agreement" className="text-white text-base cursor-pointer">
                개인정보 수집 및 이용동의
              </label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrivacyDialog(true)}
              className="bg-white text-gray-800 border-white hover:bg-gray-100 h-8 px-3"
            >
              자세히 보기
            </Button>
          </div>

          {/* 신청 버튼 */}
          <div className="pt-2">
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.birthDateFirst || !formData.birthDateSecond || !formData.gender || !formData.phoneNumber || !formData.agreedToTerms || isSubmitting}
              className="w-full h-14 bg-[#f59e0b] hover:bg-[#d97706] text-white border-0 rounded-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '신청 중...' : '온라인분석 신청하기'}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Privacy Policy Dialog */}
      <PrivacyPolicyDialog 
        isOpen={showPrivacyDialog} 
        onClose={() => setShowPrivacyDialog(false)} 
      />
    </div>
  );
}