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
          <DialogTitle className="text-xl font-bold">프라임에셋 333본부 신지후 개인정보 처리 방침</DialogTitle>
        </DialogHeader>
        {/* ✨ 수정: 전체적인 여백과 줄 간격을 조정하여 가독성을 높였습니다. */}
        <div className="max-h-[70vh] overflow-y-auto p-6 text-sm text-gray-700 space-y-8">
          <div className="space-y-3">
            <p>○ 프라임에셋 333본부 신지후는 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고 개인정보와 관련한 이용자의 고충을 원활하게 처리할 수 있도록 다음과 같은 처리방침을 두고 있습니다.</p>
            <p>○ 프라임에셋 333본부 신지후는 개인정보처리방침을 개정하는 경우 웹사이트 공지사항(또는 개별공지)을 통하여 공지할 것입니다.</p>
            <p>○ 본 방침은 2025년 09월 17일부터 시행됩니다.</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-base text-gray-900">개인정보의 수집·이용 목적</h3>
            <p>프라임에셋 333본부 신지후는 보험상담 및 상품 소개, 보험리모델링 서비스 제공, 가입권유 등 목적을 위해 개인정보를 수집·이용합니다. 수집한 개인정보는 위 목적 이외의 용도로는 사용되지 않으며, 이용 목적이 변경될 시에는 사전동의를 구할 예정입니다.</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-base text-gray-900">수집하는 개인정보 항목</h3>
            <div className="pl-4 space-y-1">
              <p>가. 개인정보 항목 : 성명, 성별, 생년월일, 전화번호, 문의사항</p>
              <p>나. 수집방법 : 홈페이지 상담신청 시 입력란에 본인이 입력하는 방식</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-bold text-base text-gray-900">제3자 제공동의</h3>
            <div className="pl-4 space-y-1">
              <p>프라임에셋 333본부 신지후는 아래와 같이 제3자에게 개인정보를 제공하고자 합니다.</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 pl-2">
                <li>제공받는자: 프라임에셋 333본부 소속 설계사</li>
                <li>제공목적: 보험상담 및 가입권유 서비스</li>
                <li>제공항목: 성명, 성별, 생년월일, 전화번호, 문의사항</li>
                <li>보유기간: 제공일(수집일)로부터 2개월</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-base text-gray-900">개인정보의 보유 및 이용기간</h3>
            <p>프라임에셋 333본부 신지후는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의 받은 개인 정보 보유, 이용기간 내에서 개인정보를 처리, 보유합니다.</p>
            <p className="pl-4">– 개인정보의 보유 및 이용기간 : 수집일로부터 2개월</p>
            <p className="pl-4">(단, 개인정보의 수집 및 이용목적이 달성되면 지체없이 파기하고 이용자가 개인정보의 수집·이용 등에 대한 동의 철회, 개인 정보 삭제 또는 파기 요청이 있는 경우 해당 개인정보를 즉시 파기합니다.)</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-base text-gray-900">개인정보의 파기절차 및 방법</h3>
            <p>프라임에셋 333본부 신지후는 개인정보 보유 및 이용기간 경과 시 지체 없이 해당 개인정보를 파기합니다. 파기의 절차 및 방법은 다음과 같습니다.</p>
            <div className="pl-4 space-y-1">
              <p>가. 파기 절차 : 이용자가 입력한 정보는 개인정보 보유 및 이용기간 경과 후 즉시 파기됩니다.</p>
              <p>나. 파기 방법 : 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 영구 삭제합니다. 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-bold text-base text-gray-900">정보주체와 법정대리인의 권리·의무 및 그 행사방법</h3>
            <p>이용자는 개인정보주체로써 다음과 같은 권리를 행사할 수 있습니다.</p>
            <div className="pl-4 space-y-1">
              <p>가. 정보주체는 프라임에셋 333본부 신지후에 대해 언제든지 개인정보 열람, 정정, 삭제, 처리정지 요구 등의 권리를 행사할 수 있습니다.</p>
              <p>나. 위 권리 행사는 프라임에셋 333본부 신지후에 대해 개인정보 보호법 시행령 제41조 제1항에 따라 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며, 프라임에셋 333본부 신지후는 이에 대해 지체 없이 조치하겠습니다.</p>
              <p>다. 위 권리 행사는 정보주체의 법정대리인이나 위임을 받은 자 등 대리인을 통하여 하실 수 있습니다. 이 경우 개인정보 보호법 시행규칙 별지 제11호 서식에 따른 위임장을 제출하셔야 합니다.</p>
              <p>라. 개인정보 열람 및 처리정지 요구는 개인정보보호법 제35조 제5항, 제37조 제2항에 의하여 정보주체의 권리가 제한 될 수 있습니다.</p>
              <p>마. 개인정보의 정정 및 삭제 요구는 다른 법령에서 그 개인정보가 수집 대상으로 명시되어 있는 경우에는 그 삭제를 요구할 수 없습니다.</p>
              <p>바. 프라임에셋 333본부 신지후는 정보주체 권리에 따른 열람의 요구, 정정·삭제의 요구, 처리정지의 요구 시 열람 등 요구를 한 자가 본인이거나 정당한 대리인인지를 확인합니다.</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-base text-gray-900">개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항</h3>
            <p>프라임에셋 333본부 신지후는 정보주체의 이용정보를 저장하고 수시로 불러오는 ‘쿠키’를 사용하지 않습니다.</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-base text-gray-900">개인정보 보호책임자</h3>
            <p>가. 프라임에셋 333본부 신지후는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만 처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
            <div className="pl-4 py-2 space-y-2">
                <p><strong>개인정보 보호책임자</strong><br />담당자: 신지후<br />연락처: 010-4554-5587<br />이메일: inserr509@daum.net</p>
                <p><strong>개인정보 보호 담당부서</strong><br />부서: 마케팅 부서<br />연락처: 010-4554-5587<br />이메일: inserr509@daum.net</p>
            </div>
            <p>나. 정보주체는 프라임에셋 333본부 신지후의 서비스(또는 사업)를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만 처리, 피해구제 등에 관한 사항을 개인정보 보호책임자 및 담당부서로 문의하실 수 있습니다. 프라임에셋 333본부 신지후는 정보주체의 문의에 대해 지체 없이 답변 및 처리해 드릴 것입니다.</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-base text-gray-900">개인정보 처리방침 변경</h3>
            <p>이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경 사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-base text-gray-900">개인정보의 안전성 확보 조치</h3>
            <p>프라임에셋 333본부 신지후는 이용자의 개인정보를 취급함에 있어 개인정보가 분실, 도난, 누출, 변조 또는 훼손되지 않도록 안전성 확보를 위하여 다음과 같은 기술적 및 관리적 대책을 강구하고 있습니다.</p>
            <div className="pl-4 space-y-1">
              <p>가. 정기적인 자체 감사 실시 : 개인정보 취급 관련 안정성 확보를 위해 정기적(분기 1회)으로 자체 감사를 실시하고 있습니다.</p>
              <p>나. 내부관리계획의 수립 및 시행 : 개인정보의 안전한 처리를 위하여 내부관리계획을 수립하고 시행하고 있습니다.</p>
              <p>다. 개인정보의 암호화 : 이용자의 개인정보는 암호화 되어 저장 및 관리되며, 파일 및 전송 데이터를 암호화 하거나 파일 잠금 기능을 사용하는 등의 별도 보안기능을 사용하고 있습니다.</p>
              <p>라. 개인정보에 대한 접근 제한 : 개인정보를 처리하는 데이터베이스시스템에 대한 접근권한의 부여, 변경, 말소를 통하여 개인정보에 대한 접근통제를 위하여 필요한 조치를 하고 있으며 침입차단시스템을 이용하여 외부로부터의 무단 접근을 통제하고 있습니다.</p>
              <p>마. 문서보안을 위한 잠금장치 사용 : 개인정보가 포함된 서류, 보조저장매체 등을 잠금장가 있는 안전한 장소에 보관하고 있습니다.</p>
              <p>바. 비인가자에 대한 출입 통제 : 개인정보를 보관하고 있는 물리적 보관 장소를 별도로 두고 이에 대해 출입통제 절차를 수립, 운영하고 있습니다.</p>
            </div>
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

