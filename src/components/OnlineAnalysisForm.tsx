import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { PrivacyPolicyDialog } from './PrivacyPolicyDialog';

interface OnlineAnalysisFormProps {
  title?: string;
  siteId: string; // 사이트 ID를 props로 받음
}

export function OnlineAnalysisForm({ title, siteId }: OnlineAnalysisFormProps) {
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
  
  const resetForm = () => setFormData({ name: '', birthDateFirst: '', birthDateSecond: '', gender: '', phoneNumber: '', agreedToTerms: false });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const now = new Date();
    const kstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));

    try {
      const payload = {
        type: 'online' as const,
        site: siteId,
        name: formData.name.trim(),
        phone: `010-${(formData.phoneNumber || '').trim()}`,
        rrnFront: formData.birthDateFirst.trim(),
        rrnBack: formData.birthDateSecond.trim(),
        gender: formData.gender as '남' | '여' | '',
        requestedAt: kstDate.toISOString(),
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
  
  // JSX 부분은 생략 (기존과 동일)
  return ( 
    // ... 원래 있던 JSX 코드 ...
  );
}