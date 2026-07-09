export type CommercialLandingStat = {
  label: string;
  value: string;
};

export type CommercialLandingFeature = {
  eyebrow: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  bullets: string[];
};

export type CommercialLandingSpecGroup = {
  title: string;
  rows: Array<{
    label: string;
    value: string;
  }>;
};

export type CommercialLandingBoxItem = {
  title: string;
  description: string;
};

export type CommercialLandingDetail = {
  heroImageSrc: string;
  heroImageAlt: string;
  price: string;
  priceNote: string;
  primaryCtaHref: string;
  primaryCtaLabel: string;
  secondaryCtaHref: string;
  secondaryCtaLabel: string;
  stats: CommercialLandingStat[];
  introTitle: string;
  introParagraphs: string[];
  features: CommercialLandingFeature[];
  award: {
    label: string;
    quote: string;
    source: string;
    imageSrc: string;
    imageAlt: string;
  };
  specGroups: CommercialLandingSpecGroup[];
  boxItems: CommercialLandingBoxItem[];
};

export type CommercialLanding = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  highlights: string[];
  specs: Array<{
    label: string;
    value: string;
  }>;
  detail?: CommercialLandingDetail;
};

export const COMMERCIAL_LANDINGS: CommercialLanding[] = [
  {
    slug: "epson-ds-870",
    title: "Máy quét Epson WorkForce DS-870",
    eyebrow: "Landing page thương mại riêng",
    description:
      "Dòng máy quét tài liệu tốc độ cao cho doanh nghiệp cần số hóa hồ sơ khối lượng lớn, vận hành bền bỉ và thao tác ổn định mỗi ngày.",
    imageSrc: "/assets/landing/epson-ds-870/ds870-hero.jpg",
    imageAlt: "Máy quét Epson WorkForce DS-870 đang quét tài liệu",
    highlights: [
      "Tốc độ quét lên tới 65 trang/phút và 130 ảnh/phút, phù hợp phòng ban xử lý hồ sơ liên tục.",
      "ADF 100 tờ cùng công suất tối đa 10.000 tờ mỗi ngày giúp vận hành ổn định trong môi trường doanh nghiệp.",
      "Tích hợp OCR, PDF tìm kiếm được và luồng quét lên cloud để đẩy nhanh quy trình số hóa tài liệu.",
    ],
    specs: [
      { label: "Model", value: "DS-870" },
      { label: "Nhóm sản phẩm", value: "Máy quét tài liệu tốc độ cao" },
      { label: "Ứng dụng", value: "Doanh nghiệp, văn thư, kế toán, lưu trữ hồ sơ" },
    ],
    detail: {
      heroImageSrc: "/assets/landing/epson-ds-870/ds870-hero.jpg",
      heroImageAlt: "Máy quét Epson WorkForce DS-870",
      price: "15.120.000 đ",
      priceNote: "Giá tham khảo đã gồm VAT, có thể thay đổi theo thời điểm.",
      primaryCtaHref: "/lien-he",
      primaryCtaLabel: "Yêu cầu tư vấn và báo giá",
      secondaryCtaHref: "#thong-so-ky-thuat",
      secondaryCtaLabel: "Xem thông số kỹ thuật",
      stats: [
        { label: "Tốc độ quét", value: "65 ppm" },
        { label: "Quét 2 mặt", value: "130 ipm" },
        { label: "ADF", value: "100 tờ" },
        { label: "Công suất đỉnh", value: "10.000 tờ/ngày" },
      ],
      introTitle: "Chiếc máy quét dành cho môi trường doanh nghiệp cần năng suất thật sự",
      introParagraphs: [
        "Epson WorkForce DS-870 là máy quét tài liệu nạp tờ rời được thiết kế cho các phòng ban phải xử lý hồ sơ dày mỗi ngày như kế toán, hành chính nhân sự, ngân hàng, bệnh viện, trường học hoặc trung tâm lưu trữ.",
        "Máy hỗ trợ quét 2 mặt chỉ trong một lần đưa giấy, giữ tốc độ cao ổn định ngay từ trang đầu tiên và giảm đáng kể thời gian thao tác thủ công khi số hóa chứng từ, hợp đồng, hóa đơn hoặc hồ sơ lưu.",
        "Điểm mạnh của mẫu này không chỉ là tốc độ, mà còn là sự cân bằng giữa độ bền, mức độ an toàn khi kéo giấy, hệ phần mềm OCR đi kèm và khả năng triển khai thực tế trong quy trình văn phòng doanh nghiệp.",
      ],
      features: [
        {
          eyebrow: "Tốc độ và năng suất",
          title: "Quét nhanh, giữ nhịp ổn định trong suốt ca làm việc",
          description:
            "DS-870 phù hợp cho đội ngũ cần xử lý lô tài liệu lớn mà vẫn muốn chất lượng ảnh ổn định, ít can thiệp thủ công và vận hành bền mỗi ngày.",
          imageSrc: "/assets/landing/epson-ds-870/ds870-front.jpg",
          imageAlt: "Mặt trước máy quét Epson WorkForce DS-870",
          bullets: [
            "Tốc độ quét lên tới 65 trang/phút và 130 ảnh/phút ở 200 hoặc 300 dpi.",
            "Quét 2 mặt một lần đưa giấy, giảm thời gian xử lý hồ sơ giấy dày.",
            "ADF 100 tờ và công suất tối đa 10.000 tờ/ngày cho môi trường làm việc cường độ cao.",
          ],
        },
        {
          eyebrow: "Xử lý giấy thông minh",
          title: "Làm việc tốt với nhiều loại chứng từ và khổ giấy khác nhau",
          description:
            "Máy quét được nhiều định dạng tài liệu từ chứng từ mỏng đến thẻ nhựa, giấy dài hoặc bộ tài liệu trộn lẫn mà vẫn hạn chế lỗi kéo giấy và kẹt giấy.",
          imageSrc: "/assets/landing/epson-ds-870/ds870-scanning.jpg",
          imageAlt: "Epson WorkForce DS-870 đang quét tài liệu",
          bullets: [
            "Hỗ trợ quét danh thiếp, thẻ nhựa cứng, hóa đơn dài và tài liệu khổ lớn qua phụ kiện phù hợp.",
            "Có chế độ Slow Speed Mode cho tài liệu mỏng hoặc dễ rách.",
            "Tích hợp phát hiện nạp chồng và cơ chế bảo vệ giấy giúp an toàn hơn với hồ sơ gốc.",
          ],
        },
      ],
      award: {
        label: "PCMag Editors' Choice",
        quote:
          "DS-870 là lựa chọn rất đáng tin cho môi trường quét khối lượng lớn, nơi tốc độ, độ ổn định và sự gọn gàng trong vận hành đều quan trọng.",
        source: "Tổng hợp theo tinh thần đánh giá PCMag cho dòng máy quét workgroup hiệu năng cao.",
        imageSrc: "/assets/landing/epson-ds-870/ds870-pcmag-editors-choice.jpg",
        imageAlt: "Hình ảnh Epson DS-870 với giải thưởng Editors' Choice",
      },
      specGroups: [
        {
          title: "Quét và hình ảnh",
          rows: [
            { label: "Loại máy", value: "Máy quét tài liệu nạp tờ rời, quét 2 mặt trong một lần đưa giấy" },
            { label: "Cảm biến", value: "CIS màu, nguồn sáng LED RGB 3 màu" },
            { label: "Độ phân giải quang học", value: "600 dpi" },
            { label: "Tốc độ quét", value: "65 ppm / 130 ipm ở 200 và 300 dpi" },
          ],
        },
        {
          title: "Xử lý giấy",
          rows: [
            { label: "ADF", value: "100 tờ" },
            { label: "Công suất đỉnh", value: "Tối đa 10.000 tờ/ngày" },
            { label: "Định lượng giấy", value: "27 - 413 g/m²" },
            { label: "Tính năng an toàn", value: "Phát hiện nạp chồng, bảo vệ giấy, chế độ quét chậm" },
          ],
        },
        {
          title: "Kết nối và phần mềm",
          rows: [
            { label: "Kết nối", value: "SuperSpeed USB 3.0" },
            { label: "Phần mềm", value: "Epson Scan 2, Document Capture, OCR, PDF tìm kiếm được" },
            { label: "Driver", value: "TWAIN, ISIS" },
            { label: "Hệ điều hành", value: "Windows và macOS" },
          ],
        },
      ],
      boxItems: [
        { title: "Máy quét DS-870", description: "Thiết bị chính hãng, tối ưu cho số hóa hồ sơ doanh nghiệp." },
        { title: "Cáp USB 3.0", description: "Kết nối tốc độ cao để giữ hiệu suất quét ổn định." },
        { title: "Adapter nguồn", description: "Bộ nguồn tiêu chuẩn đi kèm theo máy." },
        { title: "Tài liệu khởi động", description: "Hướng dẫn cài đặt nhanh và vận hành cơ bản." },
      ],
    },
  },
  {
    slug: "microtek-xt6060",
    title: "Máy quét hàng khổ A3 Microtek XT6060",
    eyebrow: "Landing page thương mại riêng",
    description:
      "Máy quét phẳng khổ A3 dùng cảm biến CCD 600 dpi, phù hợp để số hóa bản vẽ, tài liệu khổ lớn và hình ảnh cần độ chi tiết cao.",
    imageSrc: "/assets/landing/microtek-xt6060/xt6060-hero.jpg",
    imageAlt: "Máy quét hàng khổ A3 Microtek XT6060",
    highlights: [
      "Quét khổ A3 với CCD 600 dpi, phù hợp cho bản vẽ kỹ thuật, tài liệu mỹ thuật và lưu trữ hồ sơ khổ lớn.",
      "Tốc độ quét ảnh màu A3 dưới 3 giây ở 200 dpi giúp rút ngắn thời gian xử lý tài liệu hàng loạt.",
      "Tính năng Auto-Scan hỗ trợ thao tác nhanh hơn trong môi trường số hóa chuyên dụng.",
    ],
    specs: [
      { label: "Model", value: "XT6060" },
      { label: "Khổ quét", value: "A3" },
      { label: "Cảm biến", value: "CCD 600 dpi" },
      { label: "Ứng dụng", value: "Bản vẽ, tài liệu khổ lớn, tranh ảnh, lưu trữ" },
    ],
    detail: {
      heroImageSrc: "/assets/landing/microtek-xt6060/xt6060-hero.jpg",
      heroImageAlt: "Máy quét phẳng A3 Microtek XT6060",
      price: "25.000.000 đ",
      priceNote: "Giá tham khảo, có thể thay đổi theo thời điểm và cấu hình triển khai.",
      primaryCtaHref: "/lien-he",
      primaryCtaLabel: "Yêu cầu tư vấn và báo giá",
      secondaryCtaHref: "#thong-so-ky-thuat",
      secondaryCtaLabel: "Xem thông số kỹ thuật",
      stats: [
        { label: "Khổ quét", value: "A3" },
        { label: "Độ phân giải", value: "600 dpi" },
        { label: "Tốc độ A3 màu", value: "< 3 giây" },
        { label: "Kết nối", value: "USB 2.0" },
      ],
      introTitle: "Giải pháp quét phẳng A3 cho bản vẽ, ảnh và tài liệu cần độ chi tiết cao",
      introParagraphs: [
        "Microtek XT6060 là máy quét phẳng khổ A3 được thiết kế cho các môi trường cần số hóa tài liệu kích thước lớn, đặc biệt là bản vẽ kỹ thuật, hồ sơ mỹ thuật, ảnh màu hoặc tài liệu yêu cầu tái hiện chi tiết rõ ràng.",
        "Điểm nổi bật của XT6060 nằm ở cảm biến CCD 600 dpi, giúp tạo chiều sâu trường ảnh tốt hơn và giữ được độ trung thực màu sắc, phù hợp hơn các tình huống mà cảm biến CIS phổ thông chưa đáp ứng đủ.",
        "Kết hợp cùng tốc độ quét nhanh, nguồn sáng LED và tính năng Auto-Scan, mẫu này phù hợp cho đơn vị xây dựng, kiến trúc, thiết kế, lưu trữ và các phòng ban cần scan khổ A3 ổn định.",
      ],
      features: [
        {
          eyebrow: "Chất lượng hình ảnh",
          title: "CCD 600 dpi giúp tái hiện bản vẽ và tài liệu chi tiết hơn",
          description:
            "XT6060 phù hợp với các nhu cầu quét mà độ sắc nét và độ trung thực màu là ưu tiên, đặc biệt cho khổ A3 hoặc tài liệu trình bày lớn.",
          imageSrc: "/assets/landing/microtek-xt6060/xt6060-angle.jpg",
          imageAlt: "Máy quét Microtek XT6060 góc nghiêng",
          bullets: [
            "Cảm biến CCD 600 x 600 dpi giúp tái hiện chi tiết rõ hơn trên bản vẽ và hình ảnh.",
            "Nguồn sáng LED cho phép quét ngay mà không cần thời gian làm nóng.",
            "Phù hợp khi cần scan tài liệu khổ lớn nhưng vẫn muốn chất lượng ảnh ổn định.",
          ],
        },
        {
          eyebrow: "Tốc độ và tự động hóa",
          title: "Quét A3 nhanh, giảm thao tác lặp lại cho người vận hành",
          description:
            "Không chỉ mạnh ở chất lượng ảnh, XT6060 còn hỗ trợ thao tác nhanh hơn nhờ Auto-Scan và các tính năng cắt chỉnh tự động sau quét.",
          imageSrc: "/assets/landing/microtek-xt6060/xt6060-hero.jpg",
          imageAlt: "Máy quét phẳng A3 Microtek XT6060",
          bullets: [
            "Tốc độ quét ảnh màu A3 dưới 3 giây ở 200 dpi.",
            "Auto-Scan tự nhận tài liệu trên mặt kính và kích hoạt quét nhanh hơn.",
            "Tự động cắt viền và chỉnh thẳng tài liệu để file đầu ra gọn gàng hơn.",
          ],
        },
      ],
      award: {
        label: "Điểm nổi bật sản phẩm",
        quote:
          "XT6060 là lựa chọn phù hợp khi doanh nghiệp cần một máy scan A3 phẳng thiên về độ chi tiết, tốc độ quét nhanh và luồng thao tác gọn cho tài liệu khổ lớn.",
        source: "Nội dung tổng hợp theo tài liệu giới thiệu và thông số chính hãng Microtek.",
        imageSrc: "/assets/landing/microtek-xt6060/xt6060-angle.jpg",
        imageAlt: "Microtek XT6060 dùng cho quét khổ A3",
      },
      specGroups: [
        {
          title: "Quét và hình ảnh",
          rows: [
            { label: "Loại máy", value: "Máy quét phẳng tài liệu màu, khổ A3" },
            { label: "Cảm biến", value: "CCD, đèn LED" },
            { label: "Độ phân giải quang học", value: "600 x 600 dpi" },
            { label: "Tốc độ quét", value: "Ảnh màu hoặc xám khổ A3 dưới 3 giây ở 200 dpi" },
          ],
        },
        {
          title: "Khổ giấy và tính năng",
          rows: [
            { label: "Vùng quét tối đa", value: "305 x 431,8 mm, tương đương khổ A3" },
            { label: "Tài liệu phù hợp", value: "Bản vẽ, tranh ảnh, tài liệu phản xạ khổ lớn" },
            { label: "Tính năng", value: "Auto-Scan, Auto Crop, Deskew, Smart-Touch" },
            { label: "Định dạng file", value: "BMP, JPEG, PDF, TIFF, PDF/TIFF nhiều trang" },
          ],
        },
        {
          title: "Kết nối và phần mềm",
          rows: [
            { label: "Kết nối", value: "Hi-Speed USB 2.0" },
            { label: "Driver", value: "TWAIN" },
            { label: "Phần mềm", value: "ScanWizard DI, ScanPotter, DocWizard, Acrobat Reader" },
            { label: "Hệ điều hành", value: "Windows và macOS theo bộ phần mềm hỗ trợ" },
          ],
        },
      ],
      boxItems: [
        { title: "Máy quét XT6060", description: "Thiết bị scan phẳng A3 chính hãng cho nhu cầu số hóa chi tiết cao." },
        { title: "Cáp USB 2.0", description: "Kết nối Hi-Speed để truyền dữ liệu quét về máy tính." },
        { title: "Adapter nguồn", description: "Bộ nguồn đi kèm theo chuẩn thiết bị." },
        { title: "Phần mềm và hướng dẫn", description: "Bộ công cụ vận hành, quét và thiết lập ban đầu." },
      ],
    },
  },
  {
    slug: "microtek-s6570",
    title: "Máy quét tốc độ cao Microtek S6570",
    eyebrow: "Landing page thương mại riêng",
    description:
      "Máy quét tài liệu A3 hai mặt tốc độ cao, phù hợp cho môi trường số hóa khối lượng lớn cần ADF mạnh, độ bền cao và vận hành ổn định.",
    imageSrc: "/assets/landing/microtek-s6570/s6570-hero.jpg",
    imageAlt: "Máy quét tốc độ cao Microtek S6570",
    highlights: [
      "Quét A3 hai mặt tự động với tốc độ 75 trang/phút và 150 ảnh/phút ở 300 dpi.",
      "Công suất tối đa 32.000 trang/ngày phù hợp cho các dự án số hóa cường độ cao.",
      "Có chống nạp chồng siêu âm, tự nhận hướng trang và hỗ trợ quét A3 gấp đôi để tự ghép ảnh.",
    ],
    specs: [
      { label: "Model", value: "S6570" },
      { label: "Nhóm sản phẩm", value: "Máy quét A3 hai mặt tốc độ cao" },
      { label: "Tốc độ", value: "75 ppm / 150 ipm" },
      { label: "Ứng dụng", value: "Số hóa hồ sơ, cơ quan, ngân hàng, lưu trữ" },
    ],
    detail: {
      heroImageSrc: "/assets/landing/microtek-s6570/s6570-hero.jpg",
      heroImageAlt: "Máy quét tài liệu A3 hai mặt Microtek S6570",
      price: "80.000.000 đ",
      priceNote: "Giá tham khảo, phù hợp các dự án số hóa chuyên dụng và có thể thay đổi theo thời điểm.",
      primaryCtaHref: "/lien-he",
      primaryCtaLabel: "Yêu cầu tư vấn và báo giá",
      secondaryCtaHref: "#thong-so-ky-thuat",
      secondaryCtaLabel: "Xem thông số kỹ thuật",
      stats: [
        { label: "Khổ quét", value: "A3" },
        { label: "Tốc độ quét", value: "75 ppm" },
        { label: "Quét 2 mặt", value: "150 ipm" },
        { label: "Công suất đỉnh", value: "32.000/ngày" },
      ],
      introTitle: "Bản chạy thử theo hướng nhấn mạnh hiệu năng và khối lượng số hóa lớn",
      introParagraphs: [
        "Microtek S6570 là máy quét tài liệu A3 hai mặt được thiết kế cho các môi trường vận hành cường độ cao như cơ quan nhà nước, giáo dục, ngân hàng, trung tâm lưu trữ và các dự án số hóa hồ sơ quy mô lớn.",
        "Điểm mạnh nổi bật của mẫu này là tốc độ quét cao, ADF mạnh, đường giấy ổn định và công suất tối đa lên tới 32.000 trang/ngày, phù hợp cho các đơn vị không chỉ cần quét nhanh mà còn cần máy bền và chạy dài.",
        "Bản zip bạn gửi còn nhấn thêm phần cảm giác UI động hơn. Mình đang giữ tinh thần nội dung của bản đó nhưng hiển thị trên cùng khuôn landing hiện tại để bạn dễ so sánh trực tiếp với các mẫu khác.",
      ],
      features: [
        {
          eyebrow: "Năng suất và độ bền",
          title: "Thiết kế cho quy trình số hóa cường độ cao",
          description:
            "S6570 phù hợp với doanh nghiệp hoặc cơ quan có nhu cầu quét khối lượng tài liệu lớn mỗi ngày và cần máy duy trì hiệu năng ổn định trong thời gian dài.",
          imageSrc: "/assets/landing/microtek-s6570/s6570-highvolume.jpg",
          imageAlt: "Microtek S6570 xử lý khối lượng tài liệu lớn",
          bullets: [
            "Tốc độ 75 trang/phút và 150 ảnh/phút ở 300 dpi cho quét 2 mặt tự động.",
            "Khay nạp từ 100 tờ trở lên cùng đường giấy thẳng giúp nạp mượt hơn.",
            "Công suất tối đa 32.000 trang/ngày và tuổi thọ con lăn 150.000 trang.",
          ],
        },
        {
          eyebrow: "Tính năng thông minh",
          title: "Giảm lỗi thao tác trong từng lần quét",
          description:
            "Ngoài tốc độ, máy còn hỗ trợ nhiều tính năng thực tế để hạn chế kẹt giấy, sai chiều trang và các bước xử lý thủ công sau scan.",
          imageSrc: "/assets/landing/microtek-s6570/s6570-hero.jpg",
          imageAlt: "Máy quét tài liệu A3 2 mặt Microtek S6570",
          bullets: [
            "Phát hiện nạp chồng bằng siêu âm để tránh sót hoặc dính trang.",
            "Tự nhận hướng trang, tự nhận màu, tự cắt và chỉnh nghiêng tài liệu.",
            "Hỗ trợ quét A3 gấp đôi rồi tự ghép ảnh hai mặt để hoàn thiện file đầu ra.",
          ],
        },
      ],
      award: {
        label: "Bản xem thử S6570",
        quote:
          "Bản nội dung này đi theo hướng nhấn mạnh cảm giác máy công suất lớn, phù hợp nếu muốn landing page thiên về năng suất, độ bền và kịch bản số hóa dự án.",
        source: "Phát triển từ mẫu landing zip S6570 bạn gửi để so sánh trực tiếp trên local.",
        imageSrc: "/assets/landing/microtek-s6570/s6570-highvolume.jpg",
        imageAlt: "Landing thử nghiệm cho Microtek S6570",
      },
      specGroups: [
        {
          title: "Quét và hình ảnh",
          rows: [
            { label: "Loại máy", value: "Máy quét tờ rời để bàn, quét 2 mặt màu, khổ A3" },
            { label: "Cảm biến", value: "CIS, đèn LED" },
            { label: "Độ phân giải", value: "600 dpi" },
            { label: "Tốc độ quét", value: "A4 ngang 75 ppm / 150 ipm ở 300 dpi" },
          ],
        },
        {
          title: "Khổ giấy và độ bền",
          rows: [
            { label: "ADF", value: "Từ 100 tờ trở lên, theo tài liệu chính hãng" },
            { label: "Khổ quét", value: "Tối đa 305 x 1.039 mm, hỗ trợ A3 và giấy dài" },
            { label: "Công suất đỉnh", value: "32.000 trang/ngày" },
            { label: "Tuổi thọ con lăn", value: "150.000 trang" },
          ],
        },
        {
          title: "Tính năng và kết nối",
          rows: [
            { label: "Tính năng thông minh", value: "Chống nạp chồng siêu âm, tự nhận hướng trang, bỏ trang trắng, tự cắt và chỉnh nghiêng" },
            { label: "Định dạng file", value: "JPEG, PDF, TIFF, BMP, PNG, PDF/TIFF nhiều trang" },
            { label: "Kết nối", value: "SuperSpeed USB 3.0" },
            { label: "Driver", value: "TWAIN, SANE" },
          ],
        },
      ],
      boxItems: [
        { title: "Máy quét S6570", description: "Thiết bị chính cho nhu cầu scan A3 hai mặt khối lượng lớn." },
        { title: "Cáp USB 3.0", description: "Kết nối SuperSpeed cho luồng quét tốc độ cao." },
        { title: "Adapter nguồn", description: "Bộ nguồn đi kèm theo máy." },
        { title: "Phần mềm DocWizard EX", description: "Công cụ hỗ trợ quét và quản lý file đầu ra." },
      ],
    },
  },
  {
    slug: "xerox-d35wn",
    title: "Máy quét Xerox D35wn",
    eyebrow: "Landing page thương mại riêng",
    description:
      "Trang giới thiệu riêng cho Xerox D35wn để khách bấm vào đúng block nào sẽ tới đúng trang nội dung riêng của model đó.",
    imageSrc: "/assets/commercial-blocks/solution.jpg",
    imageAlt: "Máy quét Xerox D35wn",
    highlights: [
      "Tách hẳn khỏi trang danh mục để nội dung tập trung vào một model cụ thể.",
      "Có thể dùng làm trang trung gian cho quảng cáo, telesales hoặc gửi báo giá.",
      "Hiện tại phù hợp để demo local và tiếp tục nâng cấp sau khi chốt nội dung thật.",
    ],
    specs: [
      { label: "Model", value: "D35wn" },
      { label: "Kết nối", value: "USB và cấu hình phù hợp cho văn phòng" },
      { label: "Ứng dụng", value: "Quét tài liệu văn phòng doanh nghiệp" },
    ],
  },
  {
    slug: "epson-ds-790wn",
    title: "Máy quét Epson WorkForce DS-790WN",
    eyebrow: "Landing page thương mại riêng",
    description:
      "Trang riêng dành cho DS-790WN, phù hợp để giới thiệu dòng máy quét mạng cho doanh nghiệp và cơ quan cần chia sẻ quét nội bộ.",
    imageSrc: "/assets/commercial-blocks/service.jpg",
    imageAlt: "Máy quét Epson WorkForce DS-790WN",
    highlights: [
      "Khách bấm block sẽ vào đúng landing page riêng thay vì trang tổng hợp.",
      "Phù hợp cho nhu cầu số hóa nội bộ, luồng quét chia sẻ theo phòng ban.",
      "Giữ frontend độc lập để bạn có thể nâng cấp nội dung sau mà không chạm backend.",
    ],
    specs: [
      { label: "Model", value: "DS-790WN" },
      { label: "Nhóm sản phẩm", value: "Máy quét mạng doanh nghiệp" },
      { label: "Ứng dụng", value: "Quét chia sẻ nội bộ, số hóa quy trình phòng ban" },
    ],
  },
];

export function getCommercialLandingBySlug(slug: string) {
  return COMMERCIAL_LANDINGS.find((item) => item.slug === slug) ?? null;
}
