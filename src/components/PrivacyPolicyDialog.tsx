import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";

type PrivacyPolicyDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onAgree?: () => void; // ✅ 부모 컴포넌트에서 동의 상태 갱신할 수 있게
};

export function PrivacyPolicyDialog({ isOpen, onClose, onAgree }: PrivacyPolicyDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="
          sm:max-w-[720px] w-[92vw]
          max-h-[82vh] overflow-y-auto
          bg-transparent p-0 shadow-none
        "
      >
        <div className="bg-white text-gray-900 rounded-2xl p-6 md:p-8 shadow-2xl relative">
          <DialogClose
            className="absolute right-4 top-4 inline-flex items-center justify-center
                       rounded-md p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100
                       focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="닫기"
          >
            <X size={18} />
          </DialogClose>

          <DialogHeader className="mb-4 md:mb-6">
            <DialogTitle className="text-2xl font-extrabold tracking-tight">
              개인정보 처리방침
            </DialogTitle>
            <DialogDescription className="mt-2 text-gray-600">
              프라임에셋 333본부 신지후의 개인정보 처리방침입니다. (시행일: 2025년 08월 01일)
            </DialogDescription>
          </DialogHeader>

          {/* 본문 */}
          <div className="space-y-7 leading-relaxed text-[15px]">
            <section>
              <p>
                프라임에셋 333본부 신지후(이하 “회사”)는 「개인정보 보호법」을 준수하며,
                이용자의 개인정보 보호 및 권익 보호를 위하여 다음과 같은 개인정보 처리방침을 수립·공개합니다.
                본 방침은 2025년 08월 01일부터 시행됩니다.
              </p>
            </section>

            <section>
              <h3 className="mb-3 text-lg font-extrabold">1. 개인정보의 수집·이용 목적</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>보험상담 및 상품 소개</li>
                <li>보험리모델링 서비스 제공</li>
                <li>가입 권유 및 관련 고객 서비스</li>
              </ul>
            </section>

            <section>
              <h3 className="mb-3 text-lg font-extrabold">2. 수집하는 개인정보 항목 및 수집 방법</h3>
              <p>수집 항목 : 성명, 성별, 생년월일, 주민번호, 전화번호</p>
              <p>수집 방법 : 홈페이지 상담신청 시 이용자가 직접 입력</p>
            </section>

            <section>
              <h3 className="mb-3 text-lg font-extrabold">3. 개인정보의 제3자 제공</h3>
              <p>
                회사는 원칙적으로 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
                다만, 원활한 서비스 제공을 위해 다음과 같이 개인정보를 제공할 수 있습니다.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>제공받는 자 : 프라임에셋 333본부 소속 설계사</li>
                <li>제공 목적 : 보험 상담 및 가입 권유 서비스</li>
                <li>제공 항목 : 성명, 성별, 생년월일, 주민번호, 전화번호</li>
                <li>보유·이용 기간 : 제공일(수집일)로부터 12개월 (단, 목적 달성 시 즉시 파기)</li>
              </ul>
            </section>

            <section>
              <h3 className="mb-3 text-lg font-extrabold">4. 개인정보의 보유 및 이용 기간</h3>
              <p>
                회사는 수집한 개인정보를 원칙적으로 수집일로부터 12개월 동안 보유·이용합니다.
                이용 목적이 달성되거나 고객이 동의 철회·삭제를 요청할 경우 지체 없이 파기합니다.
              </p>
            </section>

            <section>
              <h3 className="mb-3 text-lg font-extrabold">5. 개인정보의 파기 절차 및 방법</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>파기 절차 : 수집·이용 목적 달성 또는 보유기간 경과 시 즉시 파기</li>
                <li>전자파일 : 복구 불가능한 기술적 방법으로 영구 삭제</li>
                <li>문서 : 분쇄 또는 소각 처리</li>
              </ul>
            </section>

            <section>
              <h3 className="mb-3 text-lg font-extrabold">6. 정보주체의 권리 및 행사 방법</h3>
              <p>
                이용자는 개인정보 주체로서 개인정보 열람, 정정, 삭제, 처리정지 요구 권리를 행사할 수 있습니다.
                개인정보보호법 시행령 제41조 제1항에 따른 서면, 이메일, FAX 등으로 행사 가능하며
                법정대리인 또는 위임장을 통한 대리 행사도 가능합니다.
              </p>
            </section>

            <section>
              <h3 className="mb-3 text-lg font-extrabold">7. 쿠키의 사용</h3>
              <p>회사는 홈페이지 이용자의 편의 제공을 위해 쿠키를 사용하지 않습니다.</p>
            </section>

            <section>
              <h3 className="mb-3 text-lg font-extrabold">8. 개인정보 보호책임자</h3>
              <p>
                회사는 개인정보 처리에 관한 업무를 총괄하여 책임지고, 관련 문의 및 불만 처리를 위하여 개인정보 보호책임자를 지정하고 있습니다.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>개인정보 보호책임자 : 신지후</li>
                <li>담당 부서 : 마케팅부서</li>
                <li>연락처 : 010-4554-5587</li>
                <li>이메일 : inserr509@daum.net</li>
              </ul>
            </section>

            <section>
              <h3 className="mb-3 text-lg font-extrabold">9. 개인정보의 안전성 확보 조치</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>정기적 자체 감사 실시</li>
                <li>내부 관리계획 수립 및 시행</li>
                <li>개인정보 암호화 및 접근 권한 관리</li>
                <li>침입차단시스템을 통한 외부 접근 통제</li>
                <li>문서보안(잠금장치 사용) 및 물리적 출입통제</li>
              </ul>
            </section>

            <section>
              <h3 className="mb-3 text-lg font-extrabold">10. 개인정보 처리방침의 변경</h3>
              <p>
                본 개인정보 처리방침은 시행일로부터 적용됩니다.
                관련 법령 및 회사 정책 변경에 따라 내용이 추가·삭제·수정될 경우,
                시행 7일 전부터 홈페이지 공지사항을 통해 안내합니다.
              </p>
            </section>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-10 px-4 border-gray-300 text-gray-700"
            >
              닫기
            </Button>
            <Button
              onClick={() => {
                // ✅ 동의 체크 처리
                onAgree?.(); 
                onClose();
              }}
              className="h-10 px-4 bg-[#f59e0b] hover:bg-[#d97706]"
            >
              동의하고 닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
