import { useState } from 'react';
import primeAssetLogo from '../assets/prime-asset-logo.png';
import { PrivacyPolicyFullDialog } from './PrivacyPolicyFullDialog'; 
import { Button } from './ui/button';

export function Footer() {
  const [isPolicyDialogOpen, setIsPolicyDialogOpen] = useState(false);

  return (
    <>
      <footer className="w-full mt-16 lg:mt-24 relative z-10">
        <div className="bg-black bg-opacity-20 border-t border-white/10">
          <div className="w-full max-w-5xl mx-auto py-10 px-6">
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-md shadow-sm">
                  <img 
                    src={primeAssetLogo} 
                    alt="프라임에셋 로고" 
                    className="h-8"
                  />
                </div>
                <div>
                  <p className="font-semibold text-white text-lg"></p>
                </div>
              </div>
              <div>
                <Button 
                  variant="link" 
                  onClick={() => setIsPolicyDialogOpen(true)}
                  className="text-white/70 hover:text-white underline hover:no-underline"
                >
                  개인정보 처리방침
                </Button>
              </div>
            </div>

            <hr className="my-6 border-white/20" />

            <div className="text-xs text-white/60 space-y-2.5">
              <p>본 내용은 모집종사자 개인의 의견이며 계약체결에 따른 이익 또는 손실은 보험계약자 등에게 귀속됩니다.</p>
              <p>보험사 및 상품별로 상이할 수 있으므로, 관련한 세부사항은 반드시 해당 약관을 참조하시기 바랍니다.</p>
              <p>본 광고는 광고심의기준을 준수하였으며, 유효기간은 심의일로부터 1년입니다.</p>
              <p>보험계약자가 기존 보험계약을 해지하고 새로운 보험계약을 체결하는 과정에서 질병이력, 연령증가 등으로 가입이 거절되거나 보험료가 인상될 수 있습니다.</p>
              <p>가입 상품에 따라 새로운 면책기간 적용 및 보장 제한 등 기타 불이익이 발생할 수 있습니다.</p>
            </div>

            <div className="mt-6 text-xs text-white/40">
              <p>설계사 신지후 (손.생보 협회 등록번호 202507-2000-3328), 프라임에셋심의필 제0000-00-0000호(2025.00.00 ~ 2026.00.00)</p>
            </div>

          </div>
        </div>
      </footer>
      <PrivacyPolicyFullDialog 
        isOpen={isPolicyDialogOpen}
        onClose={() => setIsPolicyDialogOpen(false)}
      />
    </>
  );
}

