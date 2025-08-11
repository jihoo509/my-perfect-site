import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';

interface PrivacyPolicyDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicyDialog({ isOpen, onClose }: PrivacyPolicyDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-white text-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">개인정보 처리방침</DialogTitle>
          <DialogDescription className="text-gray-600">
            개인정보 수집, 이용, 제공 및 처리에 대한 자세한 내용을 확인하실 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6 text-sm leading-relaxed">
            {/* 수집하는 개인정보 항목 및 수집 방법 */}
            <section>
              <h3 className="font-bold text-lg mb-3 text-gray-900">■ 수집하는 개인정보 항목 및 수집 방법</h3>
              
              <div className="mb-4">
                <h4 className="font-semibold mb-2 text-gray-800">1. 수집 항목</h4>
                <p className="mb-2">다음의 서비스 이용 시 아래 항목의 개인정보를 수집합니다.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>회원가입: 이름, 아이디, 생년월일, 비밀번호, 이메일, 휴대전화, 전화번호</li>
                  <li>상담 신청: 이름, 생년월일, 휴대전화, 주민등록번호, 이메일</li>
                  <li>가입 신청: 이름, 생년월일, 휴대전화, 이메일</li>
                  <li>보험료 계산: 이름, 생년월일, 주민등록번호, 휴대전화, 직업, 운전 여부, 이메일</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-gray-800">2. 수집 방법</h4>
                <p>홈페이지(회원가입, 상담 신청, 가입 신청, 보험료 설계 신청 등)</p>
              </div>
            </section>

            {/* 개인정보 수집 및 이용 목적 */}
            <section>
              <h3 className="font-bold text-lg mb-3 text-gray-900">■ 개인정보 수집 및 이용 목적</h3>
              
              <p className="mb-2">수집된 개인정보는 다음의 목적을 위해 사용됩니다.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>회원 관리: 본인 확인, 개인 식별, 불법·부정 이용 방지, 가입 의사 확인, 연령 확인, 민원 처리 및 고지사항 전달</li>
                <li>마케팅 및 광고 활용: 보험 설계 및 가입 서비스 제공, 신규 서비스 개발, 이벤트 안내 및 광고성 정보 전달</li>
                <li>비회원 대상 서비스 제공: 본인 확인, 민원 처리, 고지사항 전달, 마케팅 활용 등</li>
              </ul>
            </section>

            {/* 개인정보의 보유 및 이용 기간 */}
            <section>
              <h3 className="font-bold text-lg mb-3 text-gray-900">■ 개인정보의 보유 및 이용 기간</h3>
              
              <p className="mb-2">회사는 개인정보를 회원의 경우 회원 탈퇴 시까지, 정보 동의 고객의 경우 정보 삭제 요청 시까지 보유 및 이용합니다.</p>
              <p className="mb-2">단, 관련 법령에 따라 일정 기간 보존이 필요한 경우에는 다음과 같이 보존합니다.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>이름, 생년월일, 성별, 연락처, 직업, 서비스 이용기록 등은 보험 계약 종료 후 5년간 보관</li>
                <li>계약 또는 청약 철회 등에 관한 기록은 5년간 보관 (전자상거래법 기준)</li>
                <li>대금 결제 및 재화 공급에 관한 기록은 5년간 보관 (전자상거래법 기준)</li>
                <li>소비자의 불만 또는 분쟁 처리에 관한 기록은 3년간 보관 (전자상거래법 기준)</li>
                <li>신용정보의 수집·처리 및 이용에 관한 기록은 3년간 보관 (신용정보법 기준)</li>
              </ul>
            </section>

            {/* 개인정보 제3자 제공 */}
            <section>
              <h3 className="font-bold text-lg mb-3 text-gray-900">■ 개인정보 제3자 제공</h3>
              
              <p className="mb-2">회사는 다음의 경우를 제외하고 개인정보를 제3자에게 제공하지 않습니다.</p>
              <p className="mb-2">단, 정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 따라 제공될 수 있습니다.</p>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="list-disc pl-5 space-y-1">
                  <li>제공받는 자: 바르게 담다</li>
                  <li>제공 목적: 보험 상담, 마케팅 및 광고 활용</li>
                  <li>제공 항목: 이름, 휴대전화번호</li>
                  <li>보유 및 이용 기간: 개인정보 처리방침에서 정한 보관 기간까지</li>
                </ul>
              </div>
              
              <p className="mt-3 text-sm text-gray-600">
                위 내용에 동의하지 않으실 수 있으며, 동의 거부 시 일부 서비스 이용에 제한이 있을 수 있습니다.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}