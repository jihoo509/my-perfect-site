import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';

interface PrivacyPolicyFullDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicyFullDialog({ isOpen, onClose }: PrivacyPolicyFullDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white text-gray-800 rounded-lg p-0 max-w-3xl">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl font-bold">개인정보 처리방침</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto p-6 text-sm text-gray-700 space-y-6">
          <p className="text-xs text-gray-500">시행일: 2025년 09월 11일</p>

          <div className="space-y-2">
            <h3 className="font-bold text-base text-gray-900">제1조 (총칙)</h3>
            <p>
              프라임에셋 333지부 신지후(이하 '서비스 제공자')는 이용자의 개인정보를 매우 중요하게 생각하며, 「개인정보 보호법」 등 관련 법규를 준수하고 있습니다. 본 개인정보 처리방침을 통해 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-base text-gray-900">제2조 (개인정보의 수집 항목 및 목적)</h3>
            <p>
              서비스 제공자는 보험 상담 및 관련 서비스 제공을 목적으로 아래와 같은 최소한의 개인정보를 수집하고 있습니다.
              <br />1. 수집 항목: [전화상담] 성명, 생년월일, 성별, 연락처 / [온라인분석] 성명, 주민등록번호, 성별, 연락처
              <br />2. 수집 목적: 보험 상품 소개, 보험 리모델링, 가입 권유 및 관련 고객 서비스 제공
              <br />3. 수집 방법: 홈페이지 내 상담신청 양식을 통해 이용자가 직접 입력
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-bold text-base text-gray-900">제3조 (개인정보의 처리 및 보유 기간)</h3>
            <p>
              서비스 제공자는 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 아래와 같이 관계법령에서 정한 일정한 기간 동안 회원정보를 보관합니다.
              <br />- 보유 기간: 수집일로부터 12개월
              <br />- 파기 절차: 보유 기간 경과 시, 또는 이용자의 동의 철회 시 지체 없이 복구 불가능한 방법으로 파기합니다.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-base text-gray-900">제4조 (개인정보의 제3자 제공)</h3>
            <p>
              서비스 제공자는 원활한 서비스 제공을 위해 아래와 같이 개인정보를 제3자에게 제공할 수 있습니다.
              <br />1. 제공받는 자: 프라임에셋 333지부 소속 보험설계사
              <br />2. 제공 목적: 보험 상담 및 가입 권유 서비스
              <br />3. 제공 항목: 성명, 성별, 생년월일, 주민등록번호, 연락처
              <br />4. 보유 및 이용 기간: 제공일로부터 12개월 (단, 목적 달성 또는 동의 철회 시 즉시 파기)
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-base text-gray-900">제5조 (정보주체의 권리·의무 및 그 행사방법)</h3>
            <p>
              이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며 가입해지를 요청할 수도 있습니다. 개인정보의 열람, 정정, 삭제, 처리정지를 원하실 경우 개인정보 보호책임자에게 서면, 전화 또는 이메일로 연락하시면 지체 없이 조치하겠습니다.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-base text-gray-900">제6조 (개인정보 보호책임자)</h3>
            <p>
              서비스 제공자는 이용자의 개인정보를 보호하고 개인정보와 관련한 불만을 처리하기 위하여 아래와 같이 관련 부서 및 개인정보 보호책임자를 지정하고 있습니다.
              <br />- 개인정보 보호책임자: 신지후
              <br />- 소속: 프라임에셋 333지부
              <br />- 연락처: 010-4554-5587 (예시)
              <br />- 이메일: inserr509@daum.net (예시)
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-bold text-base text-gray-900">제7조 (고지의 의무)</h3>
            <p>
              현 개인정보 처리방침 내용 추가, 삭제 및 수정이 있을 시에는 개정 최소 7일전부터 홈페이지의 '공지사항'을 통해 고지할 것입니다.
            </p>
          </div>
        </div>
        <DialogFooter className="p-4 bg-gray-50 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

