import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { PrivacyPolicyDialog } from './PrivacyPolicyDialog';

interface OnlineAnalysisFormProps {
  title?: string;
}

const SITE_ID = import.meta.env.VITE_SITE_ID ?? 'teeth';

export function OnlineAnalysisForm({ title }: OnlineAnalysisFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    birthDateFirst: '',
    birthDateSecond: '',
    gender: '',
    phoneNumber: '',
    agreedToTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () =>
    setFormData({
      name: '',
      birthDateFirst: '',
      birthDateSecond: '',
      gender: '',
      phoneNumber: '',
      agreedToTerms: false,
    });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = {
        type: 'online' as const,
        site: SITE_ID,
        name: formData.name.trim(),
        phone: `010${(formData.phoneNumber || '').trim()}`,
        // 수정된 부분: 주민번호 앞/뒤를 합쳐서 'birth' 필드로 보냅니다.
        birth: `${formData.birthDateFirst.trim()}${formData.birthDateSecond.trim()}`,
        gender: formData.gender as '남' | '여' | '',
      };

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `서버 오류(${res.status})`);
      }

      alert('✅ 온라인 분석 신청이 정상적으로 접수되었습니다!');
      resetForm();
    } catch (err: any) {
      console.error('온라인 분석 제출 오류:', err);
      alert('제출 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10">
      <div
        className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20"
        style={{ boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.4)`}}
      >
        <div className="text-center space-y-1 mb-4">
            <h1 className="text-white text-2xl">한 눈에 비교 분석할 수 있는</h1>
            <h2 className="text-yellow-400 text-2xl">이미지 파일을 보내드립니다.</h2>
            {title && <h3 className="text-white/80 text-base mt-2">{title}</h3>}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <label className="text-white text-base block">이름</label>
            <Input
              placeholder="한글 이름을 입력"
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-white text-base block">주민번호</label>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="앞 6자리"
                value={formData.birthDateFirst}
                onChange={e => handleInputChange('birthDateFirst', e.target.value)}
                maxLength={6}
                required
              />
              <span className="text-white text-2xl">-</span>
              <Input
                type="password"
                placeholder="뒤 7자리"
                value={formData.birthDateSecond}
                onChange={e => handleInputChange('birthDateSecond', e.target.value)}
                maxLength={7}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
             <label className="text-white text-base block">성별</label>
             <div className="flex h-12 bg-white rounded-md overflow-hidden">
                <Button type="button" onClick={() => handleInputChange('gender', '남')} className={`flex-1 ${formData.gender === '남' ? 'bg-orange-500 text-white' : 'bg-white text-gray-700'}`}>남</Button>
                <Button type="button" onClick={() => handleInputChange('gender', '여')} className={`flex-1 ${formData.gender === '여' ? 'bg-orange-500 text-white' : 'bg-white text-gray-700'}`}>여</Button>
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-white text-base block">전화번호</label>
             <div className="flex items-center">
                <span className="bg-white h-12 flex items-center px-3 rounded-l-md text-gray-800">010</span>
                <Input
                  placeholder="'-' 없이 8자리 입력"
                  value={formData.phoneNumber}
                  onChange={e => handleInputChange('phoneNumber', e.target.value)}
                  maxLength={8}
                  required
                  className="rounded-l-none"
                />
             </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="online-terms-agreement"
                checked={formData.agreedToTerms}
                onCheckedChange={checked => handleInputChange('agreedToTerms', !!checked)}
              />
              <label htmlFor="online-terms-agreement" className="text-white text-base cursor-pointer">개인정보 수집 및 이용동의</label>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowPrivacyDialog(true)} className="bg-white text-gray-800">자세히 보기</Button>
          </div>
          
          <div className="pt-2">
            <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white text-xl rounded-full">
              {isSubmitting ? '신청 중...' : '온라인분석 신청하기'}
            </Button>
          </div>
        </form>
      </div>
      <PrivacyPolicyDialog isOpen={showPrivacyDialog} onClose={() => setShowPrivacyDialog(false)} />
    </div>
  );
}