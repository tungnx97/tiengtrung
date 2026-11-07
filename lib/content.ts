export type Word = {
  id: string;
  level: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  topic: string;
  example: string;
  translation: string;
  meaningLanguage?: string;
};
// Bản biên soạn tiếng Việt; phân nhóm theo lộ trình HSK 2.0 (6 cấp).
// Đây là bộ tuyển chọn, không phải danh sách từ đầy đủ hay bộ đề chính thức.
const rows: Record<number, string> = {
  1: `你好|nǐ hǎo|xin chào|Giao tiếp|你好，我叫小安。|Xin chào, tôi tên là Tiểu An.
谢谢|xièxie|cảm ơn|Giao tiếp|谢谢你的帮助。|Cảm ơn sự giúp đỡ của bạn.
再见|zàijiàn|tạm biệt|Giao tiếp|老师，再见！|Tạm biệt thầy cô!
请|qǐng|mời; xin vui lòng|Giao tiếp|请坐。|Mời ngồi.
对不起|duìbuqǐ|xin lỗi|Giao tiếp|对不起，我来晚了。|Xin lỗi, tôi đến muộn.
我|wǒ|tôi|Con người|我是学生。|Tôi là học sinh.
你|nǐ|bạn|Con người|你叫什么名字？|Bạn tên là gì?
他|tā|anh ấy|Con người|他是我的朋友。|Anh ấy là bạn của tôi.
她|tā|cô ấy|Con người|她很高兴。|Cô ấy rất vui.
我们|wǒmen|chúng tôi; chúng ta|Con người|我们学习汉语。|Chúng tôi học tiếng Trung.
老师|lǎoshī|giáo viên|Học tập|老师在学校。|Giáo viên ở trường.
学生|xuésheng|học sinh; sinh viên|Học tập|我是越南学生。|Tôi là sinh viên Việt Nam.
学习|xuéxí|học tập|Học tập|我每天学习汉语。|Tôi học tiếng Trung mỗi ngày.
汉语|Hànyǔ|tiếng Hán; tiếng Trung|Học tập|我喜欢汉语。|Tôi thích tiếng Trung.
书|shū|sách|Học tập|这是我的书。|Đây là sách của tôi.
朋友|péngyou|bạn bè|Con người|他有很多朋友。|Anh ấy có nhiều bạn.
爸爸|bàba|bố|Gia đình|我爸爸是医生。|Bố tôi là bác sĩ.
妈妈|māma|mẹ|Gia đình|妈妈在家。|Mẹ ở nhà.
家|jiā|nhà; gia đình|Gia đình|我家有三个人。|Nhà tôi có ba người.
吃|chī|ăn|Ăn uống|我想吃米饭。|Tôi muốn ăn cơm.
喝|hē|uống|Ăn uống|你喝茶吗？|Bạn uống trà không?
水|shuǐ|nước|Ăn uống|我想喝水。|Tôi muốn uống nước.
茶|chá|trà|Ăn uống|这杯茶很好喝。|Tách trà này rất ngon.
米饭|mǐfàn|cơm|Ăn uống|我喜欢吃米饭。|Tôi thích ăn cơm.
今天|jīntiān|hôm nay|Thời gian|今天天气很好。|Hôm nay thời tiết đẹp.
明天|míngtiān|ngày mai|Thời gian|明天我去学校。|Ngày mai tôi đi học.
现在|xiànzài|bây giờ|Thời gian|现在是三点。|Bây giờ là ba giờ.
喜欢|xǐhuan|thích|Đời sống|我喜欢看书。|Tôi thích đọc sách.
工作|gōngzuò|làm việc; công việc|Đời sống|他在北京工作。|Anh ấy làm việc ở Bắc Kinh.
天气|tiānqì|thời tiết|Đời sống|今天天气很热。|Hôm nay trời nóng.`,
  2: `帮助|bāngzhù|giúp đỡ|Giao tiếp|谢谢你帮助我。|Cảm ơn bạn đã giúp tôi.
介绍|jièshào|giới thiệu|Giao tiếp|我来介绍一下。|Để tôi giới thiệu một chút.
问题|wèntí|câu hỏi; vấn đề|Học tập|我有一个问题。|Tôi có một câu hỏi.
考试|kǎoshì|thi; kỳ thi|Học tập|明天我们有考试。|Ngày mai chúng tôi có kỳ thi.
教室|jiàoshì|phòng học|Học tập|学生都在教室里。|Học sinh đều ở trong lớp.
准备|zhǔnbèi|chuẩn bị|Học tập|我在准备考试。|Tôi đang chuẩn bị thi.
觉得|juéde|cảm thấy; cho rằng|Giao tiếp|我觉得这本书很好。|Tôi thấy quyển sách này hay.
知道|zhīdào|biết|Giao tiếp|我不知道他的名字。|Tôi không biết tên anh ấy.
希望|xīwàng|hy vọng|Giao tiếp|我希望明天不下雨。|Tôi hy vọng ngày mai không mưa.
快乐|kuàilè|vui vẻ|Cảm xúc|祝你生日快乐！|Chúc bạn sinh nhật vui vẻ!
休息|xiūxi|nghỉ ngơi|Sức khỏe|你应该休息一下。|Bạn nên nghỉ một lát.
累|lèi|mệt|Cảm xúc|我今天有点儿累。|Hôm nay tôi hơi mệt.
身体|shēntǐ|cơ thể; sức khỏe|Sức khỏe|你身体怎么样？|Sức khỏe của bạn thế nào?
生病|shēngbìng|bị ốm|Sức khỏe|他生病了。|Anh ấy bị ốm rồi.
运动|yùndòng|vận động; thể thao|Sức khỏe|我每天都运动。|Tôi vận động mỗi ngày.
跑步|pǎobù|chạy bộ|Sức khỏe|我们去跑步吧。|Chúng ta đi chạy bộ nhé.
旅游|lǚyóu|du lịch|Du lịch|我想去中国旅游。|Tôi muốn đi du lịch Trung Quốc.
机场|jīchǎng|sân bay|Du lịch|机场离这里很远。|Sân bay cách đây rất xa.
旁边|pángbiān|bên cạnh|Du lịch|书店在学校旁边。|Hiệu sách ở bên cạnh trường.
房间|fángjiān|phòng|Đời sống|这个房间很大。|Căn phòng này rất rộng.
便宜|piányi|rẻ|Mua sắm|这个苹果很便宜。|Quả táo này rất rẻ.
贵|guì|đắt|Mua sắm|这件衣服太贵了。|Bộ quần áo này đắt quá.
颜色|yánsè|màu sắc|Mua sắm|你喜欢什么颜色？|Bạn thích màu gì?
件|jiàn|lượng từ cho áo; việc|Mua sắm|我买了一件衣服。|Tôi đã mua một chiếc áo.
小时|xiǎoshí|giờ; tiếng đồng hồ|Thời gian|我学了两个小时。|Tôi đã học hai tiếng.
已经|yǐjīng|đã|Thời gian|我已经吃饭了。|Tôi đã ăn cơm rồi.
正在|zhèngzài|đang|Thời gian|他正在看书。|Anh ấy đang đọc sách.
因为|yīnwèi|bởi vì|Liên từ|因为下雨，我没去。|Vì trời mưa nên tôi đã không đi.
所以|suǒyǐ|cho nên|Liên từ|我很累，所以想休息。|Tôi mệt nên muốn nghỉ.
但是|dànshì|nhưng|Liên từ|我想去，但是没有时间。|Tôi muốn đi nhưng không có thời gian.`,
  3: `努力|nǔlì|nỗ lực; cố gắng|Học tập|我要努力学习。|Tôi phải cố gắng học tập.
提高|tígāo|nâng cao|Học tập|我想提高汉语水平。|Tôi muốn nâng cao trình độ tiếng Trung.
复习|fùxí|ôn tập|Học tập|考试前要认真复习。|Trước kỳ thi cần ôn tập nghiêm túc.
练习|liànxí|luyện tập|Học tập|我们每天练习口语。|Chúng tôi luyện nói mỗi ngày.
成绩|chéngjì|thành tích; điểm số|Học tập|他的成绩很好。|Điểm số của anh ấy rất tốt.
水平|shuǐpíng|trình độ|Học tập|她的汉语水平很高。|Trình độ tiếng Trung của cô ấy cao.
发现|fāxiàn|phát hiện|Đời sống|我发现了一家书店。|Tôi đã tìm thấy một hiệu sách.
了解|liǎojiě|hiểu; tìm hiểu|Giao tiếp|我想了解中国文化。|Tôi muốn tìm hiểu văn hóa Trung Quốc.
认为|rènwéi|cho rằng|Giao tiếp|你认为怎么样？|Bạn nghĩ thế nào?
决定|juédìng|quyết định|Đời sống|我决定每天早起。|Tôi quyết định dậy sớm mỗi ngày.
选择|xuǎnzé|lựa chọn|Đời sống|你可以自己选择。|Bạn có thể tự lựa chọn.
机会|jīhuì|cơ hội|Công việc|这是一个好机会。|Đây là một cơ hội tốt.
重要|zhòngyào|quan trọng|Công việc|健康很重要。|Sức khỏe rất quan trọng.
完成|wánchéng|hoàn thành|Công việc|我已经完成作业了。|Tôi đã hoàn thành bài tập.
需要|xūyào|cần|Đời sống|你需要帮助吗？|Bạn có cần giúp đỡ không?
习惯|xíguàn|thói quen; quen với|Đời sống|我习惯早上跑步。|Tôi quen chạy bộ buổi sáng.
健康|jiànkāng|khỏe mạnh; sức khỏe|Sức khỏe|祝你身体健康。|Chúc bạn sức khỏe.
环境|huánjìng|môi trường|Thiên nhiên|这里的环境很好。|Môi trường ở đây rất tốt.
世界|shìjiè|thế giới|Thiên nhiên|世界很大。|Thế giới rất rộng lớn.
季节|jìjié|mùa|Thiên nhiên|你喜欢哪个季节？|Bạn thích mùa nào?
附近|fùjìn|gần đây; vùng lân cận|Du lịch|附近有银行吗？|Gần đây có ngân hàng không?
地铁|dìtiě|tàu điện ngầm|Du lịch|我坐地铁去上班。|Tôi đi làm bằng tàu điện ngầm.
护照|hùzhào|hộ chiếu|Du lịch|请带好你的护照。|Vui lòng mang theo hộ chiếu.
行李箱|xínglixiāng|va li|Du lịch|我的行李箱很重。|Va li của tôi rất nặng.
终于|zhōngyú|cuối cùng|Thời gian|我们终于到了。|Cuối cùng chúng tôi đã đến.
突然|tūrán|đột nhiên|Thời gian|外面突然下雨了。|Bên ngoài đột nhiên đổ mưa.
一直|yìzhí|suốt; liên tục|Thời gian|他一直在等你。|Anh ấy vẫn luôn đợi bạn.
比较|bǐjiào|khá; so sánh|Giao tiếp|今天比较冷。|Hôm nay khá lạnh.
特别|tèbié|đặc biệt; rất|Giao tiếp|这个地方特别漂亮。|Nơi này rất đẹp.
其实|qíshí|thật ra|Giao tiếp|其实我也不知道。|Thật ra tôi cũng không biết.`,
  4: `坚持|jiānchí|kiên trì|Học tập|学习语言需要坚持。|Học ngôn ngữ cần sự kiên trì.
积累|jīlěi|tích lũy|Học tập|每天积累一点知识。|Mỗi ngày tích lũy một chút kiến thức.
经验|jīngyàn|kinh nghiệm|Công việc|他有丰富的工作经验。|Anh ấy có kinh nghiệm làm việc phong phú.
能力|nénglì|năng lực|Công việc|我相信你的能力。|Tôi tin vào năng lực của bạn.
责任|zérèn|trách nhiệm|Công việc|这是我的责任。|Đây là trách nhiệm của tôi.
安排|ānpái|sắp xếp|Công việc|请安排一下时间。|Hãy sắp xếp thời gian.
计划|jìhuà|kế hoạch; lên kế hoạch|Công việc|你有什么计划？|Bạn có kế hoạch gì?
讨论|tǎolùn|thảo luận|Giao tiếp|我们一起讨论这个问题。|Chúng ta cùng thảo luận vấn đề này.
解释|jiěshì|giải thích|Giao tiếp|请你解释一下。|Bạn hãy giải thích một chút.
意见|yìjiàn|ý kiến|Giao tiếp|我想听听你的意见。|Tôi muốn nghe ý kiến của bạn.
态度|tàidu|thái độ|Giao tiếp|他的态度很认真。|Thái độ của anh ấy rất nghiêm túc.
理解|lǐjiě|thấu hiểu|Giao tiếp|我能理解你的心情。|Tôi có thể hiểu tâm trạng của bạn.
尊重|zūnzhòng|tôn trọng|Giao tiếp|我们应该尊重别人。|Chúng ta nên tôn trọng người khác.
信心|xìnxīn|sự tự tin; lòng tin|Cảm xúc|我对自己有信心。|Tôi tự tin vào bản thân.
紧张|jǐnzhāng|căng thẳng|Cảm xúc|考试时不要紧张。|Khi thi đừng căng thẳng.
失望|shīwàng|thất vọng|Cảm xúc|这个结果让我很失望。|Kết quả này làm tôi thất vọng.
感动|gǎndòng|cảm động|Cảm xúc|这个故事让我很感动。|Câu chuyện này khiến tôi cảm động.
幸福|xìngfú|hạnh phúc|Cảm xúc|我觉得很幸福。|Tôi cảm thấy hạnh phúc.
适合|shìhé|phù hợp|Đời sống|这件衣服很适合你。|Bộ đồ này rất hợp với bạn.
值得|zhíde|đáng|Đời sống|这本书值得一看。|Quyển sách này đáng đọc.
成功|chénggōng|thành công|Công việc|祝你成功！|Chúc bạn thành công!
失败|shībài|thất bại|Công việc|失败也是一种经验。|Thất bại cũng là một loại kinh nghiệm.
顺利|shùnlì|thuận lợi|Đời sống|祝你考试顺利！|Chúc bạn thi thuận lợi!
发展|fāzhǎn|phát triển|Xã hội|这个城市发展很快。|Thành phố này phát triển rất nhanh.
保护|bǎohù|bảo vệ|Thiên nhiên|我们要保护环境。|Chúng ta cần bảo vệ môi trường.
污染|wūrǎn|ô nhiễm|Thiên nhiên|这里的空气污染很严重。|Ô nhiễm không khí ở đây rất nghiêm trọng.
节约|jiéyuē|tiết kiệm|Đời sống|我们应该节约用水。|Chúng ta nên tiết kiệm nước.
交通|jiāotōng|giao thông|Du lịch|这里交通很方便。|Giao thông ở đây rất thuận tiện.
尽管|jǐnguǎn|mặc dù|Liên từ|尽管很累，他还在工作。|Mặc dù mệt, anh ấy vẫn làm việc.
然而|rán'ér|tuy nhiên|Liên từ|他很努力，然而没有成功。|Anh ấy nỗ lực nhưng vẫn chưa thành công.`,
  5: `逐步|zhúbù|từng bước|Thời gian|我们会逐步解决这些问题。|Chúng tôi sẽ từng bước giải quyết các vấn đề này.
不断|búduàn|không ngừng|Thời gian|我们需要不断学习。|Chúng ta cần không ngừng học hỏi.
效率|xiàolǜ|hiệu suất|Công việc|这个方法能提高效率。|Phương pháp này nâng cao hiệu suất.
目标|mùbiāo|mục tiêu|Công việc|我有明确的目标。|Tôi có mục tiêu rõ ràng.
挑战|tiǎozhàn|thử thách|Công việc|这是一个新的挑战。|Đây là một thử thách mới.
创造|chuàngzào|sáng tạo; tạo ra|Công việc|合作可以创造更多机会。|Hợp tác có thể tạo thêm cơ hội.
沟通|gōutōng|giao tiếp; trao đổi|Giao tiếp|我们需要多沟通。|Chúng ta cần trao đổi nhiều hơn.
合作|hézuò|hợp tác|Công việc|期待与你合作。|Mong được hợp tác với bạn.
贡献|gòngxiàn|đóng góp|Xã hội|他为社会做出了贡献。|Anh ấy đã đóng góp cho xã hội.
价值|jiàzhí|giá trị|Xã hội|这份资料很有价值。|Tài liệu này rất có giá trị.
传统|chuántǒng|truyền thống|Văn hóa|春节是中国的传统节日。|Tết Nguyên đán là lễ truyền thống Trung Quốc.
观念|guānniàn|quan niệm|Xã hội|人们的消费观念在改变。|Quan niệm tiêu dùng của mọi người đang thay đổi.
风俗|fēngsú|phong tục|Văn hóa|各地的风俗不一样。|Phong tục mỗi nơi khác nhau.
欣赏|xīnshǎng|thưởng thức; trân trọng|Văn hóa|我喜欢欣赏音乐。|Tôi thích thưởng thức âm nhạc.
明确|míngquè|rõ ràng; xác định rõ|Giao tiếp|我们需要明确各自的任务。|Chúng ta cần xác định rõ nhiệm vụ của từng người.
观点|guāndiǎn|quan điểm|Giao tiếp|我同意你的观点。|Tôi đồng ý quan điểm của bạn.
分析|fēnxī|phân tích|Học tập|我们先分析一下原因。|Trước hết hãy phân tích nguyên nhân.
逻辑|luóji|logic; lô-gíc|Học tập|他的回答很有逻辑。|Câu trả lời của anh ấy rất có logic.
概念|gàiniàn|khái niệm|Học tập|这个概念不难理解。|Khái niệm này không khó hiểu.
理论|lǐlùn|lý thuyết|Học tập|理论要联系实际。|Lý thuyết cần gắn với thực tế.
实践|shíjiàn|thực tiễn; thực hành|Học tập|实践能帮助我们理解知识。|Thực hành giúp ta hiểu kiến thức.
资源|zīyuán|tài nguyên; nguồn lực|Xã hội|我们要合理利用资源。|Chúng ta cần sử dụng tài nguyên hợp lý.
能源|néngyuán|năng lượng|Thiên nhiên|太阳能是一种清洁能源。|Năng lượng mặt trời là năng lượng sạch.
趋势|qūshì|xu hướng|Xã hội|这是未来的发展趋势。|Đây là xu hướng phát triển tương lai.
现象|xiànxiàng|hiện tượng|Xã hội|这种现象很常见。|Hiện tượng này rất phổ biến.
因素|yīnsù|nhân tố; yếu tố|Xã hội|我们需要考虑各种因素。|Chúng ta cần cân nhắc các yếu tố.
措施|cuòshī|biện pháp|Xã hội|我们应该采取有效措施。|Chúng ta nên áp dụng biện pháp hiệu quả.
承担|chéngdān|gánh vác; đảm nhận|Công việc|他愿意承担责任。|Anh ấy sẵn lòng nhận trách nhiệm.
改善|gǎishàn|cải thiện|Xã hội|这项政策有助于改善生活条件。|Chính sách này giúp cải thiện điều kiện sống.
毕竟|bìjìng|dù sao; xét cho cùng|Giao tiếp|别着急，毕竟你才刚开始学。|Đừng vội, dù sao bạn mới bắt đầu học.`,
  6: `毅力|yìlì|nghị lực|Cảm xúc|学习需要毅力。|Học tập cần nghị lực.
审查|shěnchá|thẩm tra; xem xét|Công việc|委员会正在审查申请材料。|Ủy ban đang thẩm tra hồ sơ đăng ký.
论证|lùnzhèng|luận chứng; lập luận chứng minh|Học tập|作者用数据论证自己的观点。|Tác giả dùng số liệu để chứng minh quan điểm.
约束|yuēshù|ràng buộc; kiềm chế|Xã hội|制度对各方都有约束力。|Quy định có tính ràng buộc đối với mọi bên.
分歧|fēnqí|bất đồng|Giao tiếp|双方在预算上存在分歧。|Hai bên có bất đồng về ngân sách.
磋商|cuōshāng|tham vấn; thương lượng|Giao tiếp|双方还在就细节进行磋商。|Hai bên vẫn đang thương lượng về các chi tiết.
阐述|chǎnshù|trình bày; diễn giải|Giao tiếp|请阐述你的观点。|Hãy trình bày quan điểm của bạn.
推测|tuīcè|suy đoán|Học tập|这仅仅是一个推测。|Đây chỉ là một suy đoán.
验证|yànzhèng|kiểm chứng|Học tập|这个结论需要验证。|Kết luận này cần được kiểm chứng.
突破|tūpò|đột phá|Công việc|研究取得了重大突破。|Nghiên cứu đã đạt đột phá lớn.
创新|chuàngxīn|đổi mới; sáng tạo|Công việc|创新是发展的动力。|Đổi mới là động lực phát triển.
潜力|qiánlì|tiềm năng|Công việc|他很有潜力。|Anh ấy rất có tiềm năng.
机遇|jīyù|thời cơ|Công việc|我们要抓住机遇。|Chúng ta cần nắm bắt thời cơ.
战略|zhànlüè|chiến lược|Công việc|公司调整了发展战略。|Công ty đã điều chỉnh chiến lược phát triển.
制约|zhìyuē|hạn chế; chi phối|Công việc|资金不足制约了项目的发展。|Thiếu kinh phí đã hạn chế sự phát triển của dự án.
贯彻|guànchè|quán triệt; thực hiện xuyên suốt|Công việc|我们要认真贯彻这一原则。|Chúng ta cần nghiêm túc thực hiện nguyên tắc này.
循环|xúnhuán|tuần hoàn; chu trình|Thiên nhiên|这些材料可以循环使用。|Những vật liệu này có thể được tái sử dụng.
生态|shēngtài|sinh thái|Thiên nhiên|保护生态环境很重要。|Bảo vệ môi trường sinh thái rất quan trọng.
恶化|èhuà|xấu đi; trở nặng|Đời sống|如果不及时处理，情况可能恶化。|Nếu không xử lý kịp thời, tình hình có thể xấu đi.
和谐|héxié|hài hòa|Xã hội|我们希望社会更加和谐。|Chúng tôi mong xã hội hài hòa hơn.
融洽|róngqià|hòa thuận; hòa hợp|Xã hội|他们相处得很融洽。|Họ chung sống rất hòa thuận.
妥协|tuǒxié|thỏa hiệp|Giao tiếp|经过讨论，双方都愿意妥协。|Sau khi thảo luận, cả hai bên đều sẵn lòng thỏa hiệp.
障碍|zhàng'ài|trở ngại|Đời sống|语言不应该成为交流的障碍。|Ngôn ngữ không nên là trở ngại giao tiếp.
保障|bǎozhàng|bảo đảm; bảo vệ|Xã hội|这项制度保障了劳动者的权益。|Quy định này bảo vệ quyền lợi của người lao động.
熏陶|xūntáo|bồi đắp; ảnh hưởng dần|Văn hóa|她从小受到音乐的熏陶。|Cô ấy được âm nhạc bồi đắp từ nhỏ.
蕴藏|yùncáng|ẩn chứa|Văn hóa|这些故事蕴藏着丰富的智慧。|Những câu chuyện này ẩn chứa nhiều trí tuệ.
赋予|fùyǔ|trao cho; gán cho|Giao tiếp|时间赋予了它新的意义。|Thời gian đã mang cho nó ý nghĩa mới.
凝聚|níngjù|ngưng tụ; quy tụ|Xã hội|共同的目标凝聚了大家的力量。|Mục tiêu chung quy tụ sức mạnh mọi người.
锲而不舍|qiè ér bù shě|kiên trì không bỏ cuộc|Học tập|他锲而不舍地追求梦想。|Anh ấy kiên trì theo đuổi ước mơ.
循序渐进|xún xù jiàn jìn|tiến dần từng bước|Học tập|学习语言应该循序渐进。|Học ngôn ngữ nên tiến dần từng bước.`,
};
import extraVocabulary from "./vocabulary-extra.json";
import workbookVocabulary from "./vocabulary-workbook.json";
import workbookExamples from "./vocabulary-examples.json";
import markdownVocabulary from "./vocabulary-markdown.json";
import hsk1Vietnamese from "./vocabulary-hsk1-vi.json";
const curatedWords: Word[] = Object.entries(rows).flatMap(([level, text]) =>
  text.split("\n").map((line) => {
    const [hanzi, pinyin, meaning, topic, example, translation] =
      line.split("|");
    return {
      id: `${level}-${hanzi}`,
      level: Number(level),
      hanzi,
      pinyin,
      meaning,
      topic,
      example,
      translation,
    };
  }),
);
const vocabularyById = new Map<string, Word>(curatedWords.map((word) => [word.id, word]));
for (const word of extraVocabulary) if (!vocabularyById.has(word.id)) vocabularyById.set(word.id, word);
for (const entry of workbookVocabulary) {
  const previous: Word = vocabularyById.get(entry.id) ?? {
    ...entry, pinyin: "", topic: "Từ vựng", example: "", translation: "",
  };
  vocabularyById.set(entry.id, {
    ...previous, ...entry, meaningLanguage: "vi",
  });
}
const wordsByHanzi = new Map<string, Word>();
for (const word of vocabularyById.values()) if (!wordsByHanzi.has(word.hanzi)) wordsByHanzi.set(word.hanzi, word);
for (const entry of markdownVocabulary) {
  const previous = vocabularyById.get(entry.id) || wordsByHanzi.get(entry.hanzi);
  const word: Word = {
    id: entry.id, level: entry.level, hanzi: entry.hanzi,
    pinyin: entry.pinyin || previous?.pinyin || "",
    meaning: entry.meaning || previous?.meaning || "Chưa có nghĩa",
    meaningLanguage: entry.meaning ? "vi" : previous?.meaningLanguage,
    topic: previous?.topic || "Từ vựng",
    example: entry.example || previous?.example || "",
    translation: entry.example ? entry.translation || "" : previous?.translation || "",
  };
  vocabularyById.set(word.id, word);
}
export const words: Word[] = [...vocabularyById.values()].map((word) => {
  const vietnamese = word.level === 1 ? (hsk1Vietnamese as Record<string, string>)[word.hanzi] : undefined;
  if (vietnamese && (word.meaningLanguage === "en" || word.meaning === "Chưa có nghĩa")) {
    word = { ...word, meaning: vietnamese, meaningLanguage: "vi" };
  }
  const example = (workbookExamples as Record<string, { example: string; translation: string }>)[word.id];
  return !word.example && example ? { ...word, ...example } : word;
});
export const levels = [
  "Cơ bản · Làm quen",
  "Sơ cấp · Giao tiếp",
  "Trung cấp · Mở rộng",
  "Trung cấp · Tự tin",
  "Cao cấp · Khám phá",
  "Cao cấp · Chinh phục",
];
export type Grammar = {
  id: string;
  level: number;
  title: string;
  formula: string;
  explanation: string;
  example: string;
  pinyin: string;
  translation: string;
  note: string;
  prompt: string;
  options: string[];
  answer: number;
  source: string;
};
const grammarRows: Array<Omit<Grammar, "id" | "source"> & { source?: string }> =
  [
    {
      level: 1,
      title: "Giới thiệu với 是",
      formula: "Chủ ngữ + 是 + danh từ",
      explanation: "Dùng 是 để xác định ai là ai hoặc một vật là gì.",
      example: "我是越南人。",
      pinyin: "Wǒ shì Yuènán rén.",
      translation: "Tôi là người Việt Nam.",
      note: "Với tính từ, thường dùng 很 thay vì 是: 我很好。",
      prompt: "我 ___ 学生。",
      options: ["是", "很", "在", "有"],
      answer: 0,
    },
    {
      level: 1,
      title: "Câu hỏi với 吗",
      formula: "Câu trần thuật + 吗？",
      explanation:
        "Thêm 吗 cuối câu để tạo câu hỏi có/không; giữ nguyên trật tự câu.",
      example: "你喜欢喝茶吗？",
      pinyin: "Nǐ xǐhuan hē chá ma?",
      translation: "Bạn có thích uống trà không?",
      note: "Không thêm 吗 vào câu đã có từ hỏi như 什么 hoặc 谁.",
      prompt: "你是老师 ___？",
      options: ["吗", "的", "很", "和"],
      answer: 0,
    },
    {
      level: 1,
      title: "Sở hữu với 的",
      formula: "Người sở hữu + 的 + danh từ",
      explanation: "的 nối người sở hữu với vật được sở hữu.",
      example: "这是我的书。",
      pinyin: "Zhè shì wǒ de shū.",
      translation: "Đây là sách của tôi.",
      note: "Với quan hệ thân thiết có thể bỏ 的: 我妈妈 (mẹ tôi).",
      prompt: "这是我 ___ 书。",
      options: ["的", "吗", "都", "在"],
      answer: 0,
    },
    {
      level: 1,
      title: "Phủ định với 不 và 没",
      formula: "不 + động từ / 没有 + danh từ / 没（有）+ hành động",
      explanation:
        "不 thường phủ định thói quen hoặc ý muốn. 没 dùng khi một sự vật không tồn tại hoặc một hành động chưa xảy ra.",
      example: "我没有哥哥。",
      pinyin: "Wǒ méiyǒu gēge.",
      translation: "Tôi không có anh trai.",
      note: "Phủ định 有 bằng 没有, không dùng 不有.",
      prompt: "我 ___ 有钱。",
      options: ["没", "不", "很", "是"],
      answer: 0,
    },
    {
      level: 2,
      title: "Hành động đang diễn ra",
      formula: "Chủ ngữ + 正在 + động từ",
      explanation:
        "正在 đặt trước hành động để nhấn mạnh hành động đang diễn ra.",
      example: "她正在看书。",
      pinyin: "Tā zhèngzài kàn shū.",
      translation: "Cô ấy đang đọc sách.",
      note: "Có thể thêm 呢 cuối câu: 她正在看书呢。",
      prompt: "他 ___ 吃饭呢。",
      options: ["正在", "已经了", "是的", "为了"],
      answer: 0,
    },
    {
      level: 2,
      title: "So sánh với 比",
      formula: "A + 比 + B + tính từ",
      explanation: "Đặt 比 giữa hai đối tượng để so sánh một đặc điểm.",
      example: "今天比昨天热。",
      pinyin: "Jīntiān bǐ zuótiān rè.",
      translation: "Hôm nay nóng hơn hôm qua.",
      note: "Trong mẫu cơ bản này, không đặt 很 trước tính từ.",
      prompt: "今天 ___ 昨天冷。",
      options: ["比", "把", "被", "对"],
      answer: 0,
      source: "openlearn3",
    },
    {
      level: 2,
      title: "Nguyên nhân và kết quả",
      formula: "因为…，所以…",
      explanation: "因为 mở đầu nguyên nhân; 所以 giới thiệu kết quả.",
      example: "因为下雨，所以我没去。",
      pinyin: "Yīnwèi xià yǔ, suǒyǐ wǒ méi qù.",
      translation: "Vì trời mưa nên tôi đã không đi.",
      note: "Trong giao tiếp có thể chỉ dùng một trong hai liên từ.",
      prompt: "因为很累，___ 我想休息。",
      options: ["所以", "但是", "还是", "而且"],
      answer: 0,
    },
    {
      level: 2,
      title: "Trải nghiệm với 过",
      formula: "Chủ ngữ + động từ + 过 + tân ngữ",
      explanation:
        "过 đánh dấu trải nghiệm đã từng có, không tập trung vào thời điểm cụ thể.",
      example: "我去过北京。",
      pinyin: "Wǒ qùguo Běijīng.",
      translation: "Tôi đã từng đến Bắc Kinh.",
      note: "Phủ định trải nghiệm dùng 没（有）+ động từ + 过.",
      prompt: "我以前去 ___ 中国。",
      options: ["过", "着", "得", "地"],
      answer: 0,
    },
    {
      level: 3,
      title: "Xử lý đối tượng với 把",
      formula: "Chủ ngữ + 把 + tân ngữ + động từ + thành phần khác",
      explanation:
        "Nhấn mạnh cách hành động tác động lên một đối tượng đã xác định.",
      example: "请把门关上。",
      pinyin: "Qǐng bǎ mén guānshàng.",
      translation: "Vui lòng đóng cửa lại.",
      note: "Động từ thường cần kết quả, hướng hoặc thành phần bổ sung; tránh chỉ để một động từ trơ.",
      prompt: "请 ___ 书放在桌子上。",
      options: ["把", "被", "比", "从"],
      answer: 0,
    },
    {
      level: 3,
      title: "Càng… càng…",
      formula: "越 + động từ / tính từ，越 + tính từ / động từ",
      explanation: "Diễn tả hai mức độ thay đổi theo nhau.",
      example: "越练习，越熟练。",
      pinyin: "Yuè liànxí, yuè shúliàn.",
      translation: "Càng luyện tập càng thành thạo.",
      note: "越…越… khác với 越来越… (ngày càng).",
      prompt: "你 ___ 练习，就 ___ 熟练。",
      options: ["越 / 越", "又 / 再", "一 / 也", "才 / 都"],
      answer: 0,
    },
    {
      level: 3,
      title: "Vừa… vừa…",
      formula: "又 + tính từ + 又 + tính từ",
      explanation: "Nối hai đặc điểm đồng thời của cùng một đối tượng.",
      example: "这个苹果又大又甜。",
      pinyin: "Zhège píngguǒ yòu dà yòu tián.",
      translation: "Quả táo này vừa to vừa ngọt.",
      note: "Với hai hành động đồng thời, có thể dùng 一边…一边….",
      prompt: "这家饭店 ___ 便宜 ___ 好吃。",
      options: ["又 / 又", "越 / 越", "才 / 就", "虽然 / 但是"],
      answer: 0,
    },
    {
      level: 3,
      title: "Bổ ngữ khả năng",
      formula: "Động từ + 得 / 不 + bổ ngữ kết quả",
      explanation:
        "Diễn tả có thể hoặc không thể đạt được kết quả của hành động.",
      example: "这句话我听不懂。",
      pinyin: "Zhè jù huà wǒ tīng bu dǒng.",
      translation: "Câu này tôi nghe không hiểu.",
      note: "听不懂 nói về khả năng hiểu, khác với 没听懂 là đã nghe nhưng không hiểu.",
      prompt: "说慢一点儿，我听 ___ 懂。",
      options: ["不", "没", "别", "无"],
      answer: 0,
    },
    {
      level: 4,
      title: "Bất kể… đều…",
      formula: "不管 + điều kiện， 都 / 也 + kết quả",
      explanation: "Kết quả không thay đổi dù điều kiện có khác nhau.",
      example: "不管多忙，我都每天学习。",
      pinyin: "Bùguǎn duō máng, wǒ dōu měitiān xuéxí.",
      translation: "Dù bận thế nào, tôi vẫn học mỗi ngày.",
      note: "Có thể dùng 无论 thay 不管 trong nhiều ngữ cảnh.",
      prompt: "不管天气怎么样，我 ___ 去跑步。",
      options: ["都", "才", "却不", "否则"],
      answer: 0,
    },
    {
      level: 4,
      title: "Không những… mà còn…",
      formula: "不仅…，而且…",
      explanation:
        "Thêm một thông tin có mức độ hoặc phạm vi cao hơn thông tin trước.",
      example: "她不仅会说汉语，而且会写汉字。",
      pinyin: "Tā bùjǐn huì shuō Hànyǔ, érqiě huì xiě Hànzì.",
      translation: "Cô ấy không chỉ nói tiếng Trung mà còn viết chữ Hán.",
      note: "Cùng chủ ngữ: chủ ngữ thường đặt trước 不仅.",
      prompt: "他不仅聪明，___ 很努力。",
      options: ["而且", "否则", "尽管", "以免"],
      answer: 0,
    },
    {
      level: 4,
      title: "Chỉ cần… thì…",
      formula: "只要 + điều kiện， 就 + kết quả",
      explanation: "Đưa ra điều kiện đủ để đạt kết quả.",
      example: "只要坚持，就会进步。",
      pinyin: "Zhǐyào jiānchí, jiù huì jìnbù.",
      translation: "Chỉ cần kiên trì thì sẽ tiến bộ.",
      note: "Phân biệt 只有…才… diễn tả điều kiện cần.",
      prompt: "只要认真学习，___ 会进步。",
      options: ["就", "才", "却", "否则"],
      answer: 0,
    },
    {
      level: 4,
      title: "Câu bị động với 被",
      formula: "Chủ ngữ chịu tác động + 被 + tác nhân + động từ + kết quả",
      explanation: "Đưa đối tượng chịu tác động lên đầu câu.",
      example: "我的手机被弟弟弄坏了。",
      pinyin: "Wǒ de shǒujī bèi dìdi nònghuài le.",
      translation: "Điện thoại của tôi bị em trai làm hỏng.",
      note: "Có thể lược tác nhân khi không rõ hoặc không cần nhắc đến.",
      prompt: "我的自行车 ___ 人骑走了。",
      options: ["被", "把", "比", "让给"],
      answer: 0,
    },
    {
      level: 5,
      title: "Đã… thì…",
      formula: "既然…，就…",
      explanation:
        "Dựa vào một sự thật đã được chấp nhận để đưa ra kết luận hoặc đề nghị.",
      example: "既然来了，就坐一会儿吧。",
      pinyin: "Jìrán lái le, jiù zuò yíhuìr ba.",
      translation: "Đã đến rồi thì ngồi một lát đi.",
      note: "既然 thường dùng khi người nghe đã biết hoặc chấp nhận tiền đề.",
      prompt: "既然决定了，___ 别犹豫。",
      options: ["就", "才", "否则", "尽管"],
      answer: 0,
    },
    {
      level: 5,
      title: "Thà… cũng không…",
      formula: "宁可…，也不…",
      explanation: "Nêu lựa chọn chấp nhận một điều để tránh điều khác.",
      example: "我宁可走路，也不坐这么贵的车。",
      pinyin: "Wǒ nìngkě zǒulù, yě bù zuò zhème guì de chē.",
      translation: "Tôi thà đi bộ chứ không đi xe đắt như vậy.",
      note: "Hai vế phải là các lựa chọn có thể so sánh trong cùng hoàn cảnh.",
      prompt: "他宁可多花时间，___ 不愿意放弃。",
      options: ["也", "才", "就", "却又"],
      answer: 0,
    },
    {
      level: 5,
      title: "Ngay cả… cũng…",
      formula: "连 + thành phần được nhấn mạnh + 都 / 也…",
      explanation:
        "Lấy một trường hợp đặc biệt để nhấn mạnh phạm vi hoặc mức độ.",
      example: "连他都知道这件事。",
      pinyin: "Lián tā dōu zhīdào zhè jiàn shì.",
      translation: "Ngay cả anh ấy cũng biết chuyện này.",
      note: "Phần sau 连 có thể là danh từ hoặc cụm động từ.",
      prompt: "这道题连孩子 ___ 会做。",
      options: ["都", "才", "仅", "却不"],
      answer: 0,
    },
    {
      level: 5,
      title: "Trừ khi… nếu không…",
      formula: "除非…，否则…",
      explanation:
        "Nêu điều kiện ngoại lệ; nếu không có điều đó thì kết quả sau xảy ra.",
      example: "除非下雨，否则我们照常出发。",
      pinyin: "Chúfēi xià yǔ, fǒuzé wǒmen zhàocháng chūfā.",
      translation:
        "Trừ khi trời mưa, nếu không chúng ta vẫn khởi hành như thường.",
      note: "Đọc kỹ quan hệ phủ định để tránh đảo nghĩa hai vế.",
      prompt: "除非你同意，___ 我不会去。",
      options: ["否则", "而且", "即使", "既然"],
      answer: 0,
    },
    {
      level: 6,
      title: "Sở dĩ… là vì…",
      formula: "之所以 + kết quả，是因为 + nguyên nhân",
      explanation:
        "Nêu kết quả trước, rồi giải thích nguyên nhân dẫn đến kết quả đó.",
      example: "他之所以进步快，是因为每天都练习。",
      pinyin: "Tā zhī suǒyǐ jìnbù kuài, shì yīnwèi měitiān dōu liànxí.",
      translation: "Sở dĩ anh ấy tiến bộ nhanh là vì luyện tập mỗi ngày.",
      note: "Khác với 因为…所以…, cấu trúc này đưa kết quả lên trước.",
      prompt: "他之所以改变计划，___ 天气恶化了。",
      options: ["是因为", "于是", "所以", "从而"],
      answer: 0,
    },
    {
      level: 6,
      title: "Còn hơn là…",
      formula: "与其…，不如…",
      explanation: "So sánh hai lựa chọn và đề xuất lựa chọn ở vế sau.",
      example: "与其担心，不如行动。",
      pinyin: "Yǔqí dānxīn, bùrú xíngdòng.",
      translation: "Thay vì lo lắng, chi bằng hành động.",
      note: "Lựa chọn sau 不如 là lựa chọn người nói đánh giá tốt hơn.",
      prompt: "与其抱怨，___ 想办法解决。",
      options: ["不如", "尽管", "以便", "何况"],
      answer: 0,
    },
    {
      level: 6,
      title: "Dù… cũng…",
      formula: "即便…，也…",
      explanation:
        "Giả định một điều kiện cực đoan nhưng kết quả vẫn không thay đổi.",
      example: "即便失败，我也不会放弃。",
      pinyin: "Jíbiàn shībài, wǒ yě bú huì fàngqì.",
      translation: "Dù thất bại, tôi cũng không bỏ cuộc.",
      note: "即便 gần nghĩa với 即使, thường gặp trong văn viết.",
      prompt: "即便很困难，我们 ___ 要试一试。",
      options: ["也", "才", "否则", "于是"],
      answer: 0,
    },
    {
      level: 6,
      title: "Chưa kể… huống chi…",
      formula: "连…都…，更何况…",
      explanation:
        "Dựa trên một trường hợp để suy ra trường hợp khác còn rõ ràng hơn.",
      example: "连大人都觉得难，更何况孩子呢。",
      pinyin: "Lián dàrén dōu juéde nán, gèng hékuàng háizi ne.",
      translation: "Ngay cả người lớn còn thấy khó, huống chi trẻ em.",
      note: "Hai vế cần có quan hệ suy luận cùng chiều.",
      prompt: "大人都受不了，___ 孩子呢。",
      options: ["更何况", "否则", "以免", "从而"],
      answer: 0,
    },
  ];
export const grammar: Grammar[] = grammarRows.map((g, index) => ({
  ...g,
  id: `g-${index + 1}`,
  source: g.source || "curriculum",
}));
export const sources = [
  {
    id: "laowai-hsk2",
    name: "Laowai · HSK 2.0",
    type: "Danh sách từ HSK 2.0",
    url: "https://laowaiapp.com/hsk/2.0/",
    description: "Nguồn danh sách từ được ghi trong các tệp HSK 1–6 của dự án. Các tệp là danh sách tích lũy và có những mục chưa có nghĩa hoặc ví dụ.",
    badge: "Danh sách từ",
  },
  {
    id: "cti",
    name: "Chinese Tests Service · CTI",
    type: "Tài liệu HSK chính thức",
    url: "https://www.chinesetest.cn/HSK/1?type=3",
    description:
      "Tra cứu đề cương, đề mẫu và thông tin kỳ thi. Trang chính thức có khu vực riêng cho HSK 3.0; hãy kiểm tra phiên bản khi đăng ký thi.",
    badge: "Chính thức",
  },
  {
    id: "mdbg",
    name: "MDBG · CC-CEDICT",
    type: "Từ điển & phát âm",
    url: "https://www.mdbg.net/chinese/dictionary?page=cc-cedict",
    description:
      "Nguồn đối chiếu chữ Hán và pinyin. Nghĩa tiếng Việt và ví dụ trong ứng dụng được biên soạn lại; không sao chép toàn bộ từ điển.",
    badge: "Từ điển mở",
  },
  {
    id: "openlearn1",
    name: "OpenLearn · Chinese 1",
    type: "Nhập môn tiếng Trung",
    url: "https://www.open.edu/openlearn/languages/getting-started-chinese-1/content-section-overview",
    description:
      "Khóa học của The Open University: chào hỏi, đại từ, số đếm và làm quen với pinyin.",
    badge: "Khóa học miễn phí",
  },
  {
    id: "openlearn2",
    name: "OpenLearn · Chinese 2",
    type: "Giao tiếp & trật tự câu",
    url: "https://www.open.edu/openlearn/languages/getting-started-chinese-2/content-section-overview",
    description:
      "Tài liệu học về hoạt động hàng ngày, vị trí thời gian trong câu, từ để hỏi và câu hỏi lựa chọn.",
    badge: "Đại học",
  },
  {
    id: "openlearn3",
    name: "OpenLearn · Chinese 3",
    type: "Cấu trúc so sánh",
    url: "https://www.open.edu/openlearn/mod/oucontent/view.php?id=109137&section=_unit3.4",
    description:
      "Tham khảo cách so sánh với 比, kết hợp các hoạt động thực hành tiếng Trung ở cấp độ tiếp theo.",
    badge: "Đại học",
  },
  {
    id: "curriculum",
    name: "United Nations · Chinese Curriculum",
    type: "Khung nội dung ngôn ngữ",
    url: "https://hr.un.org/sites/hr.un.org/files/Chinese%20Language%20Curriculum_0.pdf",
    description:
      "Khung tham khảo chủ điểm và ngữ pháp. Giải thích tiếng Việt, ví dụ và câu hỏi trong ứng dụng được tự biên soạn; cấp bài học là lộ trình nội bộ.",
    badge: "Khung tham khảo",
  },
];
