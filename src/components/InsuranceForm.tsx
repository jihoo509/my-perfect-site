import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';

interface InsuranceFormProps {
  title?: string;
}

export function InsuranceForm({ title }: InsuranceFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    gender: '',
    phoneNumber: '',
    agreedToTerms: false
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    console.log('신청 데이터:', formData);
    alert('전문가 무료상담 신청이 접수되었습니다!');
  };

  return (
    <div className="w-full max-w-md relative z-10">
      {/* 둥근 사각형 배경 컨테이너 */}
      <div 
        className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20"
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
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-white text-xl leading-relaxed">
            한 눈에 비교 분석할 수 있는
          </h1>
          <h2 className="text-[#fbbf24] text-xl leading-relaxed">
            이미지 파일을 보내드립니다.
          </h2>
          {title && (
            <h3 className="text-white/80 text-sm mt-2">
              {title}
            </h3>
          )}
        </div>

        {/* 폼 */}
        <div className="space-y-4">
          {/* 이름 입력 */}
          <div className="space-y-2">
            <label className="text-white text-sm block">이름</label>
            <Input
              placeholder="한글 이름을 입력"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="bg-white border-0 h-12 text-gray-800 placeholder:text-gray-500"
            />
          </div>

          {/* 생년월일 입력 */}
          <div className="space-y-2">
            <label className="text-white text-sm block">생년월일</label>
            <Input
              placeholder="생년월일을 입력 (예:19850101)"
              value={formData.birthDate}
              onChange={(e) => handleInputChange('birthDate', e.target.value)}
              className="bg-white border-0 h-12 text-gray-800 placeholder:text-gray-500"
              maxLength={8}
            />
          </div>

          {/* 성별 선택 */}
          <div className="space-y-2">
            <label className="text-white text-sm block">성별</label>
            <div className="flex h-12 bg-white rounded-md overflow-hidden">
              <button
                onClick={() => handleInputChange('gender', '남')}
                className={`flex-1 flex items-center justify-center space-x-2 transition-colors ${
                  formData.gender === '남' 
                    ? 'bg-[#f59e0b] text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  formData.gender === '남' ? 'bg-orange-400' : 'bg-gray-300'
                }`}>
                  👨
                </div>
                <span>남</span>
              </button>
              <button
                onClick={() => handleInputChange('gender', '여')}
                className={`flex-1 flex items-center justify-center space-x-2 transition-colors ${
                  formData.gender === '여' 
                    ? 'bg-[#f59e0b] text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  formData.gender === '여' ? 'bg-orange-400' : 'bg-gray-300'
                }`}>
                  👩
                </div>
                <span>여</span>
              </button>
            </div>
          </div>

          {/* 전화번호 입력 */}
          <div className="space-y-2">
            <label className="text-white text-sm block">전화번호</label>
            <div className="flex space-x-2">
              <div className="bg-white rounded-md px-3 py-3 text-gray-800 text-sm w-16 text-center">
                010
              </div>
              <span className="text-white text-xl flex items-center">-</span>
              <Input
                placeholder="휴대폰번호 8자리 입력"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className="bg-white border-0 h-12 text-gray-800 placeholder:text-gray-500 flex-1"
                maxLength={8}
              />
            </div>
          </div>

          {/* 개인정보 동의 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={formData.agreedToTerms}
                onCheckedChange={(checked) => handleInputChange('agreedToTerms', checked)}
                className="border-white data-[state=checked]:bg-[#f59e0b] data-[state=checked]:border-[#f59e0b]"
              />
              <label className="text-white text-sm">
                개인정보 수집 및 이용동의
              </label>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-gray-800 border-white hover:bg-gray-100 h-8 px-3"
            >
              보기
            </Button>
          </div>

          {/* 신청 버튼 */}
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.birthDate || !formData.gender || !formData.phoneNumber || !formData.agreedToTerms}
              className="w-full h-14 bg-[#f59e0b] hover:bg-[#d97706] text-white border-0 rounded-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              전문가 무료상담 신청하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}