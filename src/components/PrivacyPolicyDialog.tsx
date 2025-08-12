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
  onAgree?: () => void;
};

export function PrivacyPolicyDialog({ isOpen, onClose, onAgree }: PrivacyPolicyDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Content 자체는 투명 처리, 내부에 흰 카드 래퍼 추가 */}
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
              개인정보 수집, 이용, 제공 및 처리에 대한 자세한 내용을 확인하실 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {/* 본문 */}
          <div className="space-y-7 leading-relaxed text-[15px]">
            <section>
              <h3 className="mb-3 text-lg font-extrabold">■ 수집하는 개인정보 항목 및 수집 방법</h3>
              <h4 className="mb-2 font-bold">1. 수집 항목</h4>
              <p className="mb-2">다음의 서비스 이용 시 아래 항목의 개인정보를 수집합니다.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>회원가입: 이름, 아이디, 생년월일, 비밀번호, 이메일, 휴대전화, 전화번호</li>
                <li>상담 신청: 이름, 생년월일, 휴대전화, 주민등록번호, 이메일</li>
                <li>가입 신청: 이름, 생년월일, 휴대전화, 이메일</li>
                <li>보험료 계산: 이름, 생년월일, 주민등록번호, 휴대전화, 직업, 운전 여부, 이메일</li>
              </ul>

              <h4 className="mt-4 mb-2 font-bold">2. 수집 방법</h4>
              <p>홈페이지(회원가입, 상담 신청, 가입 신청, 보험료 설계 신청 등)</p>
            </section>

            <section>
              <h3 className="mb-3 text-lg font-extrabold">■ 개인정보 수집 및 이용 목적</h3>
              <p className="mb-2">수집된 개인정보는 다음의 목적을 위해 사용됩니다.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>회원 관리: 본인 확인, 개인 식별, 불법·부정 이용 방지, 가입 의사 확인, 연령 확인, 민원 처리 및 고지사항 전달</li>
                <li>마케팅 및 광고 활용: 보험 설계 및 가입 서비스 제공, 신규 서비스 개발, 이벤트 안내 및 광고성 정보 전달</li>
                <li>비회원 대상 서비스 제공: 본인 확인, 민원 처리, 고지사항 전달, 마케팅 활용 등</li>
              </ul>
            </section>

            <section>
              <h3 className="mb-3 text-lg font-extrabold">■ 개인정보의 보유 및 이용 기간</h3>
              <p className="mb-2">
                회사는 개인정보를 회원의 경우 회원 탈퇴 시까지, 정보 동의 고객의 경우 정보 삭제 요청 시까지 보유 및 이용합니다.
              </p>
              <p className="mb-2">단, 관련 법령에 따라 일정 기간 보존이 필요한 경우에는 다음과 같이 보존합니다.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>이름, 생년월일, 성별, 연락처, 직업, 서비스 이용기록 등은 보험 계약 종료 후 5년간 보관</li>
                <li>계약 또는 청약 철회 등에 관한 기록은 5년간 보관 (전자상거래법 기준)</li>
                <li>대금 결제 및 재화 공급에 관한 기록은 5년간 보관 (전자상거래법 기준)</li>
                <li>소비자의 불만 또는 분쟁 처리에 관한 기록은 3년간 보관 (전자상거래법 기준)</li>
                <li>신용정보의 수집·처리 및 이용에 관한 기록은 3년간 보관 (신용정보법 기준)</li>
              </ul>
            </section>

            <section>
              <h3 className="mb-3 text-lg font-extrabold">■ 개인정보 제3자 제공</h3>
              <p className="mb-2">회사는 다음의 경우를 제외하고 개인정보를 제3자에게 제공하지 않습니다.</p>
              <p className="mb-2">
                단, 정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 따라 제공될 수 있습니다.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>제공받는 자: 바르게 담다</li>
                <li>제공 목적: 보험 상담, 마케팅 및 광고 활용</li>
                <li>제공 항목: 이름, 휴대전화번호</li>
                <li>보유 및 이용 기간: 개인정보 처리방침에서 정한 보관 기간까지</li>
              </ul>

              <p className="mt-4 text-gray-700">
                위 내용에 동의하지 않으실 수 있으며, 동의 거부 시 일부 서비스 이용에 제한이 있을 수 있습니다.
              </p>
            </section>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="h-10 px-4 border-gray-300 text-gray-700">
              닫기
            </Button>
            <Button
              onClick={() => {
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
