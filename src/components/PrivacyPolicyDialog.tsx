import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function PrivacyPolicyDialog({ isOpen, onClose }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* 패널 배경/테두리/블러를 명시적으로 추가 */}
      <DialogContent
        className="
          sm:max-w-[720px]
          rounded-2xl
          border border-white/10
          bg-[rgba(15,30,70,0.95)]
          text-white
          shadow-2xl
          backdrop-blur-md
          max-h-[80vh]
          overflow-y-auto
        "
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            개인정보 수집 및 이용 동의
          </DialogTitle>
          <DialogDescription className="text-white/70">
            아래 내용을 확인해 주세요.
          </DialogDescription>
        </DialogHeader>

        {/* --- 정책 본문: 기존에 쓰던 내용이 있으면 이 자리에 그대로 넣으세요 --- */}
        <div className="space-y-4 leading-relaxed text-white/90 text-sm">
          <section>
            <h3 className="font-semibold mb-1">1. 수집 항목</h3>
            <p>이름, 주민등록번호(앞·뒤 13자리), 성별, 연락처</p>
          </section>

          <section>
            <h3 className="font-semibold mb-1">2. 수집 목적</h3>
            <p>보험 상담/분석 제공 및 결과 안내</p>
          </section>

          <section>
            <h3 className="font-semibold mb-1">3. 보유 및 이용기간</h3>
            <p>수집일로부터 목적 달성 후 즉시 파기 (관련 법령에 따른 보관 예외 포함)</p>
          </section>

          <section>
            <h3 className="font-semibold mb-1">4. 동의 거부 권리</h3>
            <p>동의를 거부하실 수 있으며, 이 경우 서비스 제공이 제한될 수 있습니다.</p>
          </section>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          <Button onClick={onClose}>동의하고 닫기</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
