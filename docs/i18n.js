// Trove: Simplified Chinese wording. app.js writes English; translatePage() swaps whole text pieces for
// their Chinese version when the language is set to 中文. Listings, names and messages people write
// themselves stay in the language they were written in.
// These translations were written without a native speaker's review: have one check them before launch.

const ZH = {
  // Digital tab, Pulse, overview
  'What needs doing, and how the shop is doing.': '要处理的事，以及店铺的情况。',
  'Match device': '跟随设备', 'Light peach': '浅桃色', 'My purchases': '我的购买', 'Browse': '浏览', 'Start selling': '开始出售',
  'Selling on Trove Digital': '在 Trove 数字出售', 'List on Trove Digital': '在 Trove 数字上架', 'Nothing bought on Trove Digital yet.': '还没有在 Trove 数字购买过。',
  'Earned': '已赚到', 'Held for you': '为你托管中', 'Sales': '销售', 'Listings': '商品', 'Needs an answer': '待回答', 'No listings yet.': '还没有商品。',
  'Pulse': '脉搏', 'Your shop at a glance, live. Switch the range or what the charts show.': '一眼看清店铺实时状况。可切换时间范围和图表内容。',
  '7 days': '7 天', '30 days': '30 天', '90 days': '90 天', 'last 7 days': '最近 7 天', 'last 30 days': '最近 30 天', 'last 90 days': '最近 90 天',
  'LIVE': '实时', 'Exact numbers are in Insights': '准确数字请看洞察', 'Recent activity': '最近动态',
  'Orders': '订单', 'Views': '浏览', 'Average order': '平均订单', 'vs the period before': '对比上一期', 'New this period': '本期新增',
  'What buyers paid for your items.': '买家为你的商品支付的金额。', 'Finished sales, any size.': '已完成的销售，不论大小。',
  'People opening your listings.': '打开你商品的人数。', 'Bundle items to raise this.': '组合出售可以提高这个数字。',
  'Shop pulse': '店铺脉搏', 'Sales this period against the one before. 50 means level.': '本期销售对比上一期。50 表示持平。',
  'PULSE': '脉搏', 'Released': '已放款', 'Held': '托管中', 'Live': '在售',
  'Signal': '信号', 'Spot busy and quiet days. Tap a number above or switch here to change what it shows.': '找出忙碌和冷清的日子。点上面的数字或在这里切换显示内容。', 'Show': '显示',
  'Sales clock': '销售时钟', 'Set meetups and post new listings when buyers are most active.': '在买家最活跃的时候安排见面和上新。', 'BUSIEST': '最忙', 'Sales by hour': '按小时的销售',
  'Category orbit': '类别轨道', 'Which types earn the most, so you know what to buy more of.': '哪类商品赚得最多，帮你决定多进什么货。', 'Sales by type': '按类别的销售',
  'Shop profile': '店铺画像', 'Your strongest and weakest habits as a seller, out of 100.': '你作为卖家最强和最弱的习惯，满分 100。',
  'Speed': '速度', 'Trust': '信任', 'Variety': '种类', 'Replies': '回复', 'Demand': '需求', 'Momentum': '势头',
  'Buyer flow': '买家流向', 'Where buyers drop off between looking and buying.': '买家在浏览到购买之间在哪一步离开。', 'Buyer flow, last 30 days': '买家流向',
  'Sales honeycomb': '销售蜂巢', 'Streaks and gaps over 12 weeks, one cell per day.': '12 周内的连续和空档，每格一天。', 'Sales by day, last 12 weeks': '最近 12 周每天销售',
  'Weekly equalizer': '每周均衡器', 'Is the shop growing week to week?': '店铺是否每周在增长？', 'Week of': '当周', 'This week': '本周',
  'Shop health': '店铺健康', 'Small habits that keep buyers coming back.': '让买家回头的小习惯。',
  'Listings live': '在售商品', 'Questions answered': '已回答问题', 'Money released': '已放款', 'Sales goal': '销售目标',
  'Saved': '已收藏', 'Question': '提问', 'views': '次浏览', 'Listing views': '商品浏览', 'Bring the item and check the buyer\'s code.': '带上商品并核对买家的交接码。',
  // Trove Digital
  'Digital': '数字', 'Trove Digital': 'Trove 数字', 'New': '新', 'Lessons, advice and downloads': '课程、咨询和下载', 'Newest': '最新',
  'match on Trove Digital': '个结果在 Trove 数字', 'matches on Trove Digital': '个结果在 Trove 数字',
  'Lessons, advice, downloads and game items.': '课程、咨询、下载和游戏物品。',
  'Still no fees. Your money is held until the session happens or you have what you paid for.': '依然没有手续费。款项会被托管，直到课程完成或你收到所买的东西。',
  'Search Trove Digital': '搜索 Trove 数字', 'All': '全部', 'Sessions': '课程预约', 'Downloads': '下载', 'Game items': '游戏物品',
  'Coaching and lessons': '辅导和课程', 'Expert advice': '专家咨询', 'Creative services': '创意服务',
  'Book a time. The seller is paid after the session.': '预约时间。课程结束后卖家才收到款项。',
  'Delivered after you pay, with 2 days to check it.': '付款后交付，你有 2 天检查。',
  'Traded in the game. Only for games whose rules allow it.': '在游戏内交易。仅限规则允许的游戏。',
  'results for': '个结果：', 'Nothing yet': '暂时没有', 'Try another word, or browse all of Trove Digital.': '换个关键词，或浏览全部 Trove 数字。', 'See everything': '查看全部',
  'Sell what you know': '出售你的专长', 'Lessons, appraisals, guides and game items go on the same shop and dashboard as everything else you sell.': '课程、鉴定、指南和游戏物品，和你卖的其他东西用同一个店铺和后台。',
  'List a service': '发布服务', 'Session': '课程', 'Download': '下载', 'Game item': '游戏物品',
  'Pick a time': '选择时间', 'No times free right now. Ask the seller below.': '目前没有空闲时间。可以在下面问卖家。',
  'Your character name': '你的角色名', 'So the seller knows who to trade with.': '让卖家知道和谁交易。', 'Book and pay': '预约并付款', 'Buy now': '立即购买',
  "Paid now, held until the session is over. If it doesn't happen, you get it back.": '现在付款，托管到课程结束。如果课程没有进行，全额退还。',
  'Paid now, held for 2 days after delivery so you can check it.': '现在付款，交付后托管 2 天，方便你检查。',
  'Paid now, held until you confirm the item arrived in your game.': '现在付款，托管到你确认物品已到游戏内。',
  'Demo: nothing is charged.': '演示：不会实际扣款。', 'Not available right now.': '目前无法购买。', 'Questions': '问题', 'More from': '更多来自',
  'Your session': '你的课程', 'The seller sends a video call link before it starts.': '开始前卖家会发送视频通话链接。',
  'Your download': '你的下载', 'Demo: a real file link goes here.': '演示：这里会是真实的文件链接。',
  'The seller sends it within 2 days, or you are refunded.': '卖家会在 2 天内发送，否则自动退款。',
  'Your game item': '你的游戏物品', 'Character': '角色', 'The seller trades it to your character in the game, within 2 days.': '卖家会在 2 天内在游戏内交易给你的角色。',
  'Mark session done': '标记课程完成', 'You can mark it done once it has started.': '课程开始后才能标记完成。', 'Deliver by': '交付期限',
  'Download link or file name': '下载链接或文件名', 'How you handed it over': '你是怎么交付的', 'Mark delivered': '标记已交付',
  'What are you selling?': '你要卖什么？', 'A thing': '实物', 'Shipped, picked up or dropped off': '发货、自取或送货上门',
  'A session': '课程预约', 'Lessons, coaching or advice by video call': '视频课程、辅导或咨询', 'A download': '下载', 'Guides, templates, files or custom work': '指南、模板、文件或定制作品',
  'A game item': '游戏物品', 'Handed over inside a game': '在游戏内交付', 'Type': '类型',
  'What the buyer gets': '买家会得到什么', 'What happens, how long it takes, what they need.': '会发生什么、需要多久、买家要准备什么。',
  'Length (minutes)': '时长（分钟）', 'Start times': '开始时间', 'Hours, e.g. 10, 14, 19': '小时，例如 10, 14, 19', "Days you're free": '你有空的日子',
  'Buyers can book these times for the next two weeks.': '买家可以预约未来两周的这些时间。', "What's included": '包含什么',
  'Send a file automatically (optional)': '自动发送文件（可选）', 'Leave empty for custom work you deliver yourself. Demo: type a file name.': '定制作品自己交付的话留空。演示：输入一个文件名。',
  'Game': '游戏', "This game's rules allow selling this item for real money": '这个游戏的规则允许用真钱出售这个物品',
  "Many games don't allow it. Check the game's terms first. Accounts can't be sold on Trove.": '很多游戏不允许。请先查看游戏条款。Trove 不允许出售账号。',
  'Session marked done.': '课程已标记完成。', 'Marked as delivered.': '已标记交付。', 'That time was just taken. Pick another.': '这个时间刚被预约了，请换一个。',
  'Booked. Your money is held until the session is over.': '已预约。款项会托管到课程结束。', 'Paid. Your money is held until you have it.': '已付款。款项会托管到你收到为止。',
  'Session held. The buyer has 2 days to report a problem.': '课程已完成。买家有 2 天可以报告问题。',
  'Digital orders are paid online.': '数字订单需在线付款。', 'Add the download link or file.': '请添加下载链接或文件。',
  'Say how and when you handed it over in the game.': '请说明你在游戏内何时、如何交付的。', "The session hasn't happened yet.": '课程还没有进行。',
  'Recent sales': '最近的销售', 'See all': '查看全部', 'Shipped': '已发货', 'Meetup': '见面交易', 'profit': '利润', 'Show fewer': '收起', 'Show all': '显示全部',
  // console layout and landing
  'Overview': '概览', 'What needs doing, and how the last 30 days went.': '要处理的事，以及最近 30 天的情况。',
  'Meetups and ship-by dates for the next two weeks.': '未来两周的见面和发货期限。', 'Everything you have for sale, plus drafts.': '你在售的所有商品和草稿。',
  'Questions to answer, and who is watching what.': '要回答的问题，以及谁在关注什么。', 'What you earned, what is on the way, and what each sale cost.': '已赚到的、在路上的，以及每笔销售的成本。',
  'What sells, when, and where buyers drop off.': '什么好卖、何时好卖，以及买家在哪一步离开。', 'How your shop looks to buyers.': '买家看到的店铺样子。',
  'Selling': '销售', 'Analytics': '分析', 'Shop': '店铺', 'View your shop': '查看你的店铺', 'New listing': '上架新商品',
  'Open insights': '打开洞察', 'Sales, last 30 days': '最近 30 天销售额', 'Orders, last 30 days': '最近 30 天订单', 'Listing views, last 30 days': '最近 30 天浏览量',
  'Next meetup': '下次见面', 'saves and carts': '次收藏和加购', 'questions': '个问题', 'order': '个订单', 'orders': '个订单',
  'Last 8 weeks, counted when the buyer has the item.': '最近 8 周，买家收到商品后计入。', 'Completed orders': '已完成订单',
  'Sales per day': '每天销售额', 'Orders per day': '每天订单', 'Views per day': '每天浏览',
  // insights charts
  'Last 4 weeks': '最近 4 周', 'Last 12 weeks': '最近 12 周', 'All time': '全部', 'Date range': '时间范围',
  'Item sales': '商品销售额', 'Shipping charged': '收取的运费', 'What items cost you': '商品成本', 'Shipping labels': '运单费用',
  'From sales to profit': '从销售额到利润', 'Money in': '收入', 'Costs': '成本', 'Step': '步骤', 'Amount': '金额',
  'Sales by day': '每天的销售', 'Less': '少', 'More': '多', 'Day': '星期', 'Sales': '销售额',
  'Price and time to sell': '价格和卖出所需时间', 'Days to sell': '卖出天数', 'From views to sold': '从浏览到成交',
  'Views': '浏览', 'Saves and questions': '收藏和提问', 'Added to cart': '加入购物车', 'Count': '数量', 'Kept': '留存',
  'How long listings have waited': '在售商品等了多久', '0 to 7 days': '0 到 7 天', '1 to 4 weeks': '1 到 4 周', '1 to 2 months': '1 到 2 个月',
  'Over 2 months': '超过 2 个月', 'Edit price': '修改价格', 'None.': '没有。', 'Click a bar to see those listings.': '点击柱子查看这些商品。',
  'Waiting': '等待时间', 'Value': '价值', 'What you paid and what it sold for': '成本和售价', 'Average cost': '平均成本',
  'Average price': '平均售价', 'Profit per item': '每件利润', 'When handoffs happen': '交接时间分布',
  'Morning': '上午', 'Afternoon': '下午', 'Evening': '傍晚', 'Late': '深夜', 'Orders': '订单',
  'Typical time to sell': '一般卖出时间', 'No sales in this range yet. Try All time.': '这段时间还没有销售。试试“全部”。', 'Show table': '显示表格',
  // header, menu, footer
  'Skip to content': '跳到内容', 'Demo.': '演示。', 'No real payments; saved in this browser only.': '不会真实付款；数据只保存在此浏览器中。',
  'Skip ahead 1 day': '快进 1 天', 'Reset': '重置', 'Search anything': '搜索任何东西', 'Search': '搜索', 'Sell': '出售',
  'Dashboard': '卖家中心', 'Cart': '购物车', 'Menu': '菜单', 'My orders': '我的订单', 'Alerts': '提醒', 'Wanted': '求购',
  'Settings': '设置', 'Help and returns': '帮助与退货', 'Terms and privacy': '条款与隐私',
  // browse
  'Browse': '浏览', 'Search results': '搜索结果', 'Categories': '类别', 'All': '全部', 'Antiques': '古董', 'Collectibles': '收藏品',
  'Home': '家居', 'Kitchen': '厨房', 'Clothing': '服装', 'Electronics': '电子产品', 'Books': '书籍', 'Toys and games': '玩具和游戏',
  'Sports': '运动', 'Other': '其他', 'Sort': '排序', 'Best match': '最相关', 'Newest': '最新', 'Lowest price': '价格从低到高',
  'Highest price': '价格从高到低', 'Pickup near me': '附近自取', 'Nothing yet': '暂时没有',
  "Add it to Wanted and you'll get an alert when someone lists it.": '把它加到求购里，有人上架时会提醒你。',
  'Add to Wanted': '加入求购', 'Pickup only': '仅限自取',
  // conditions
  'New': '全新', 'Unused, in its box or with tags': '未使用，带包装或吊牌', 'Like new': '几乎全新', 'Barely used, no visible wear': '很少使用，没有明显磨损',
  'Good': '良好', 'Normal wear, small flaws': '正常磨损，有小瑕疵', 'Fair': '一般', 'Clear wear or repairs': '明显磨损或修补过',
  'For parts': '仅作零件', 'Broken or incomplete': '损坏或不完整',
  // item
  'Shipping from': '运费', 'Free pickup': '免费自取', 'In your cart': '已在购物车', 'Add to cart': '加入购物车',
  'Add to favourites': '收藏', 'In favourites': '已收藏',
  "Your money is held until it's in your hands.": '款项会被托管，直到你拿到物品。', 'How it works': '了解流程',
  'Reserved.': '已预留。', 'Sold.': '已售出。', 'Get an alert for similar': '有类似物品时提醒我', 'Flaws:': '瑕疵：',
  'Size': '尺寸', 'Age': '年代', 'Material': '材质', 'Details': '细节', 'Confirmed': '已确认', 'Estimated': '估计',
  'sale': '笔成交', 'sales': '笔成交', 'New seller': '新卖家', 'Questions': '问答', 'Waiting for an answer.': '等待回答。',
  'Your question': '你的问题', 'Ask the seller': '向卖家提问', 'Ask': '提问',
  'ships in': '平均', 'days on average': '天内发货', 'problem': '次问题', 'problems': '次问题',
  'For sale': '在售', 'Nothing listed right now.': '目前没有在售物品。', 'Sold': '已售出',
  // cart and checkout
  'Empty.': '购物车是空的。', 'Start browsing': '去逛逛', 'Remove': '移除', 'Delivery': '配送', 'Ship it': '快递', 'Tracked': '可追踪',
  'Pick it up': '自取', 'Free, inspect before you hand over your code': '免费，先验货再给交接码', 'Local drop-off': '本地送货',
  'seller': '卖家', 'Not available for everything here': '部分物品不支持', 'Payment': '付款', 'Pay now, protected': '现在付款，有保障',
  'Held until the handoff': '交接前款项被托管', 'Pay in person': '当面付款', 'Cash or e-Transfer, not protected': '现金或 e-Transfer，没有保障',
  'Items': '商品', 'Shipping': '运费', 'Drop-off': '送货', 'Pickup': '自取', 'Free': '免费', 'Tax': '税', 'Total': '合计',
  'more small items fit at no extra shipping.': '件小物品可免运费放进同一箱。', 'Checkout': '结账',
  'Card orders start at $5.00. Add another item, or choose a meetup and pay in person.': '刷卡订单最低 $5.00。请再加一件物品，或选择见面交易并当面付款。',
  'Shipped orders are paid online.': '快递订单需在线付款。', 'Your cart is empty.': '购物车是空的。',
  'Name': '姓名', 'Email': '邮箱', 'Address': '地址', 'Meet at': '见面地点', 'When': '时间',
  'Public library entrance': '公共图书馆门口', 'Police station safe exchange spot, where offered': '警察局安全交易点（如有）',
  'A busy coffee shop': '人多的咖啡店', "Seller's door (address shared after you reserve)": '卖家门口（预留后提供地址）', 'Your address': '你的地址',
  'Send me new arrivals now and then': '偶尔给我发送新品信息', 'Pay': '支付', 'Reserve': '预留', 'Demo: nothing is charged.': '演示：不会扣款。',
  'By ordering you agree to the': '下单即表示你同意', 'terms': '条款', 'orders, one per seller.': '个订单，每位卖家一个。',
  // orders
  'Order': '订单', 'Ships by': '发货期限', ", or you're refunded.": '，否则自动退款。', 'Money releases': '款项将于',
  ' unless you report a problem.': '放款，除非你报告问题。', 'unless you report a problem.': '放款，除非你报告问题。',
  'Handoff code': '交接码', 'Drop-off at your address': '送到你的地址', 'Check the item, then read this code to the seller.': '先检查物品，再把交接码告诉卖家。',
  'Got it, all good': '已收到，没问题', 'Report a problem': '报告问题', 'What went wrong?': '出了什么问题？', 'Photos (optional)': '照片（可选）',
  'Report': '提交', "Your money stays held until it's sorted.": '问题解决前款项继续托管。', 'Timeline': '进度', 'Cancel order': '取消订单',
  'Paid online, protected': '已在线付款，有保障', 'Paying in person': '当面付款', 'Tracking': '物流单号', 'Packed by the seller': '卖家打包照片',
  'Where the money is': '款项状态', 'No orders yet.': '还没有订单。', 'Status': '状态', 'Order not found': '找不到订单',
  // order states and money steps
  'Paid, money held': '已付款，款项托管中', 'Shipped': '已发货', 'Delivered': '已送达', 'Reserved for meetup': '已预留，等待见面',
  'Problem reported': '已报告问题', 'Complete': '已完成', 'Complete (paid in person)': '已完成（当面付款）', 'Refunded': '已退款', 'Cancelled': '已取消',
  'Paid': '已付款', 'Held': '托管中', 'Released': '已放款', 'Paid out': '已到账', 'Reserved': '已预留', 'Paid at handoff': '交接时付款',
  // timeline
  'Paid. The money is held until the item reaches you.': '已付款。物品送达前款项被托管。', 'Reserved. Payment happens in person.': '已预留。当面付款。',
  'Shipped. Tracking': '已发货。物流单号', 'Delivered.': '已送达。', 'Buyer confirmed it arrived as described.': '买家确认物品与描述相符。',
  'Problem reported:': '已报告问题：', 'Handoff confirmed. Money released.': '交接完成，已放款。', 'Handoff confirmed. Paid in person.': '交接完成，已当面付款。',
  'Cancelled. Refunded in full.': '已取消，全额退款。', 'Cancelled.': '已取消。', 'Problem closed. Money released.': '问题已解决，已放款。',
  'Problem closed. Refunded.': '问题已解决，已退款。', 'Not shipped in time. Refunded automatically.': '未按时发货，已自动退款。',
  'Check window passed. Money released.': '检查期已过，已放款。',
  'No delivery scan after two weeks. Money stays held while it is checked.': '两周没有送达记录，核查期间款项继续托管。',
  'Meetup passed without a handoff. Reservation cancelled.': '见面时间已过但未交接，预留已取消。',
  // alerts
  'Order confirmed. Your money is held until the item arrives.': '订单已确认。物品送达前款项被托管。',
  'New order. Ship it by the deadline to get paid.': '新订单。请在期限内发货以收款。',
  'Item reserved. Bring your handoff code to the meetup.': '物品已预留。见面时请带上交接码。',
  'Item reserved for a meetup. Pay is collected at the handoff.': '物品已预留等待见面，交接时收款。',
  'Shipped. Track it from your order page.': '已发货。可在订单页查看物流。',
  'Delivered. Check it over, then tap "Got it" or report a problem.': '已送达。请检查物品，然后点“已收到”或报告问题。',
  "Delivered. Payment releases after the buyer's check window.": '已送达。买家检查期结束后放款。',
  'The buyer confirmed. Payment released.': '买家已确认，已放款。', 'Thanks! The seller has been paid.': '谢谢！卖家已收到款项。',
  'The buyer reported a problem. Payment stays held while you sort it out.': '买家报告了问题。解决前款项继续托管。',
  "We've told the seller. Your money stays held.": '已通知卖家，你的款项继续托管。',
  'Handoff confirmed.': '交接完成。', 'Handoff confirmed. Enjoy your find!': '交接完成，祝你喜欢！', 'Order cancelled.': '订单已取消。',
  'Problem closed. Payment released to the seller.': '问题已解决，款项已付给卖家。', 'Problem closed. Payment released.': '问题已解决，已放款。',
  'Refund issued.': '已退款。', 'Order refunded.': '订单已退款。',
  "The seller didn't ship in time, so you've been refunded in full.": '卖家未按时发货，已全额退款给你。',
  'Not shipped in time: the buyer was refunded.': '未按时发货：已退款给买家。', 'Check window passed. Payment released.': '检查期已过，已放款。',
  'No delivery scan yet. Your money stays held while we look into it.': '还没有送达记录，核查期间款项继续托管。',
  'No delivery scan for this order. Add proof of delivery.': '此订单没有送达记录，请补充送达证明。',
  'The meetup passed without a handoff, so the reservation was cancelled.': '见面时间已过但未交接，预留已取消。',
  'Meetup passed without a handoff. The item is back on sale.': '见面时间已过但未交接，物品已重新上架。',
  'as seller': '作为卖家', 'as buyer': '作为买家', 'new': '新', 'View': '查看', 'No alerts yet.': '还没有提醒。',
  // wanted
  "Can't find it? Post it. Sellers see it, and you get an alert when it's listed.": '找不到？发个求购。卖家能看到，上架时你会收到提醒。',
  'What are you looking for?': '你在找什么？', 'Max price (optional)': '最高价格（可选）', 'Email for the alert (optional)': '接收提醒的邮箱（可选）',
  'Post': '发布', 'People are looking for': '大家在找',
  // settings
  'Language': '语言', 'Alerts when buying': '购买提醒', 'Alerts when selling': '出售提醒', 'Only what matters': '只发重要提醒',
  'Every step': '每一步都提醒', 'New-arrival emails': '新品邮件', 'Save': '保存', 'Your data': '你的数据',
  'Download my data': '下载我的数据', 'Delete my data': '删除我的数据',
  // dashboard
  'Demo, viewing as': '演示，当前身份', 'Seller': '卖家', 'To do': '待办', 'Listings': '商品', 'Money': '收入', 'Insights': '洞察', 'Profile': '资料',
  'Nothing to do.': '没有待办事项。', 'Try it: buy something as a buyer, then come back.': '试试看：先以买家身份买点东西，再回来。',
  'Ship by': '发货期限', 'Tracking number': '物流单号', 'Label cost': '面单费用', 'Packing photo (protects you in a dispute)': '打包照片（发生纠纷时保护你）',
  'Mark shipped': '标记已发货', 'Paid online.': '已在线付款。', 'Collect': '收款', "Buyer's code": '买家交接码', 'Confirm handoff': '确认交接',
  'Demo: the code is': '演示：交接码是', 'Demo: mark delivered': '演示：标记已送达', 'Sorted, release money': '已解决，放款',
  'Refund buyer': '退款给买家', "Can't fulfil, cancel": '无法完成，取消', 'List an item': '上架商品', 'Item': '商品', 'Price': '价格',
  'Edit': '编辑', 'Hide': '隐藏', 'Show': '显示', 'Hidden': '已隐藏',
  'On the way to you': '即将到账', 'Earned': '已收入', 'Card fees': '刷卡手续费', 'Profit after costs': '扣除成本后的利润',
  'Completed orders': '已完成订单', 'Export for accounting': '导出给会计', 'Date': '日期', 'Fee': '手续费', 'You got': '实收', 'Profit': '利润',
  'None yet.': '暂无。', 'Trove charges no fee. Card fees are an estimate until payments are live.': 'Trove 不收任何费用。正式收款前，刷卡手续费为估算值。',
  'Your best categories': '你最好卖的类别', 'Shows up after your first sale.': '第一笔成交后显示。', 'What buyers on Trove want': 'Trove 买家想要什么',
  "From every buyer's Wanted posts and searches that found nothing.": '来自所有买家的求购和无结果的搜索。', 'Nothing yet.': '暂时没有。',
  'Needs an answer': '待回答', 'Your answer': '你的回答', 'Answer': '回答', 'No questions yet.': '还没有问题。',
  'Shop name': '店名', 'City': '城市', 'About': '简介', 'Shown on your profile.': '显示在你的主页上。', 'View profile': '查看主页',
  // listing form
  'Sell something': '出售物品', 'Edit listing': '编辑商品', 'Add photos': '添加照片',
  'Tap to choose, or drag them here. Show any flaws.': '点击选择，或拖到这里。请拍出所有瑕疵。',
  'Describe the photos in a few words': '用几个字描述照片', 'For people using screen readers.': '供使用读屏软件的人使用。',
  'Title': '标题', 'Price ($)': '价格（$）', 'Category': '类别', 'Condition': '成色', 'Flaws': '瑕疵',
  'Chips, scratches, missing parts. Or write "None".': '缺口、划痕、缺件。没有就写“无”。', 'e.g. 21 cm tall, or size M': '例如：高 21 cm，或 M 码',
  'Description (optional)': '描述（可选）', 'Age or era': '年代', 'e.g. 1950s': '例如：1950 年代', 'How sure?': '确定吗？',
  "Maker's marks": '厂家标记', 'More details': '更多信息', 'What you paid ($)': '你的进价（$）', 'Private, for your profit figures': '不公开，用于计算利润',
  'How many': '数量', 'Box size': '箱子大小', 'Small': '小', 'Medium': '中', 'Large': '大',
  'Shoebox size. Up to 4 share a box': '鞋盒大小，最多 4 件同箱', 'Up to 3 share a box': '最多 3 件同箱', 'Ships on its own': '单独发货',
  'Can ship': '可快递', 'Pickup or local drop-off': '可自取或本地送货', 'Publish': '发布', 'Listing as': '发布身份', 'Free to list.': '免费上架。',
  'Cover': '封面', 'Make cover': '设为封面', 'Photo': '照片',
  'Add at least one photo.': '请至少添加一张照片。', 'Give it a title.': '请填写标题。', 'Set a price.': '请填写价格。', 'Pick a condition.': '请选择成色。',
  'Describe any flaws, or write "None".': '请描述瑕疵，没有就写“无”。', 'Pick a box size.': '请选择箱子大小。', 'Add measurements.': '请填写尺寸。',
  'Say whether the age is estimated or confirmed.': '请说明年代是估计的还是确认的。', 'Describe the photos in a few words.': '请用几个字描述照片。',
  'Allow shipping, pickup, or both.': '请选择快递、自取或两者都可以。', 'Choose': '请选择', 'Pick a category.': '请选择类别。',
  // front page, tour, buyer tools
  'Buy and sell anything, safely.': '买卖任何东西，安全放心。', 'Take the tour': '功能导览', 'What Trove does': 'Trove 能做什么',
  'Pay safely': '安全付款', "Money held until it's yours": '拿到物品前款项被托管', 'Meet with a code': '凭码当面交易',
  'Check it, then share 6 digits': '先验货，再给 6 位交接码', 'Sell in a minute': '一分钟上架', 'Photo, price, done. Free': '拍照、定价、完成。免费',
  'Seller dashboard': '卖家中心', 'Sales, buyers, meetups': '销售、买家、见面安排',
  'Under $10': '$10 以下', '$10 to $50': '$10 到 $50', '$50 to $100': '$50 到 $100', '$100 and up': '$100 以上',
  'See more at once': '一次看更多', 'Bigger photos': '大图显示', 'Recently viewed': '最近浏览', 'See all': '查看全部',
  'Share': '分享', 'Share this shop': '分享这家店', 'Sections': '分类', 'Link copied. Paste it into WeChat, RedNote or Facebook.': '链接已复制，可粘贴到微信、小红书或 Facebook。',
  'Hidden. Bring it back from Menu, Take the tour.': '已隐藏。可在菜单的“功能导览”中重新显示。',
  'Tour': '导览', 'Skip': '跳过', 'Next': '下一步', 'Done': '完成',
  'Welcome to Trove. Buy and sell anything, with your money protected.': '欢迎来到 Trove。买卖任何东西，款项有保障。',
  'Search anything. Try “lamp under $30”.': '搜索任何东西。试试“lamp under $30”。',
  'Browse by type. Tap “See more at once” for a tighter grid.': '按类别浏览。点“一次看更多”可以显示更多商品。',
  'Tap an item for photos, flaws and questions.': '点开商品可查看照片、瑕疵和问答。',
  'Sell in a minute. Photo, price, done. Free.': '一分钟上架。拍照、定价、完成。免费。',
  'Your dashboard: sales, interested buyers and meetups.': '卖家中心：销售、感兴趣的买家和见面安排。',
  'Orders, alerts, Wanted, settings and 中文 live here.': '订单、提醒、求购、设置和语言切换都在这里。',
  "That's it. Happy hunting!": '就这些，祝你淘到好东西！',
  // dashboard additions
  'Schedule': '日程', 'Interest': '关注', 'Sold in the last 7 days': '近 7 天销售额', 'Next meetup': '下次见面', 'Saves and carts': '收藏和加购',
  'Questions to answer': '待回答问题', 'Next two weeks': '未来两周', 'Ship': '发货', 'No meetups booked.': '还没有预约见面。',
  'Add many at once': '批量添加', 'One photo per item. Finish them later.': '每件一张照片，之后再补充信息。', 'Drafts to finish': '待完成的草稿',
  'Draft': '草稿', 'Finish': '完成', 'Delete': '删除', 'draft added.': '件草稿已添加。', 'drafts added.': '件草稿已添加。', 'Finish listing': '完成商品信息',
  'Sales by week': '每周销售额', 'items sold': '件已售', 'Most watched': '最受关注', 'Views, saves, questions and carts.': '浏览、收藏、提问和加购次数。',
  "Who's interested": '谁感兴趣', 'view': '次浏览', 'views': '次浏览', 'save': '次收藏', 'saves': '次收藏', 'question': '个问题', 'questions': '个问题',
  'in a cart': '人加购', 'in carts': '人加购', 'A guest': '一位访客', 'saved': '收藏了', 'asked': '提问了', 'added to cart': '加入了购物车',
  'Answered questions': '已回答的问题',
  'Sales and items sold, after the buyer has it.': '销售额和已售件数（买家收到后计入）。',
  // design round 2
  'Browse': '浏览', 'Type': '类别', 'Show': '显示', 'More per row': '每行显示更多', 'Remove filter': '移除筛选',
  'No fees to buy or sell.': '买卖都不收费。', 'Sellers keep the full price. Buyers pay only the price and any delivery.': '卖家拿到全部售价。买家只付商品价格和配送费（如有）。',
  'Money held until delivery': '收货前款项托管', 'The seller is paid after you have the item': '你拿到物品后，卖家才收到款项',
  'Meet up with a code': '凭交接码见面交易', 'Check the item, then give your 6-digit code': '先检查物品，再给出 6 位交接码',
  'Post from your phone': '用手机发布', 'Add photos and a price, then share the link': '添加照片和价格，再分享链接',
  'See what sells': '看看什么好卖', 'Sales, interested buyers and meetups in one place': '销售、感兴趣的买家和见面安排一目了然',
  'Welcome to Trove. No fees for buyers or sellers, and your payment is held until you have the item.': '欢迎来到 Trove。买家和卖家都不收费，你拿到物品前款项会被托管。',
  'Browse by type or price here, or show more per row.': '在这里按类别或价格浏览，也可以每行显示更多。',
  'Post something for sale: add photos and a price, then share the link.': '发布出售物品：添加照片和价格，再分享链接。',
  'Your orders, alerts, Wanted posts, settings and 中文 are here.': '你的订单、提醒、求购、设置和语言切换都在这里。',
  'Colours': '配色', 'Background': '背景', 'Buttons': '按钮', 'Saved in this browser. Switch any time.': '保存在此浏览器中，可随时切换。',
  'White': '白色', 'Cream': '奶油色', 'Light blue': '浅蓝', 'Light peach': '浅桃色', 'Creamy orange': '奶油橙', 'Light cream': '浅奶油色',
  'Match device': '跟随设备', 'Dark': '深色', 'Navy': '藏青', 'Charcoal': '炭灰', 'Sage': '灰绿',
  'Fees you paid': '你支付的费用', 'No fees for you or your buyers. Trove pays the card processing.': '你和买家都不用付费。刷卡手续费由 Trove 承担。',
  // toasts and errors
  'Added to cart.': '已加入购物车。', 'Sent.': '已发送。', 'Saved.': '已保存。', 'Listed.': '已上架。', 'Deleted.': '已删除。', 'Demo reset.': '演示已重置。',
  'Clock moved a day. Deadlines applied.': '时间前进了一天，已应用各项期限。', 'Shipped. The buyer has been told.': '已发货，已通知买家。',
  'Reserved. Your handoff code is ready.': '已预留，交接码已生成。', 'Paid. Your money is held until it arrives.': '已付款，送达前款项被托管。',
  'Posted. Some are already listed, showing them now.': '已发布。已有相关物品在售，现在为你显示。', "Posted. You'll get an alert when it's listed.": '已发布，上架时会提醒你。',
  'Tap again to confirm': '再点一次确认', "That code doesn't match. Ask the buyer to read it again.": '交接码不对，请让买家再读一遍。',
  'A tracking number is needed to mark an order shipped.': '需要物流单号才能标记已发货。', 'Please say what went wrong.': '请说明出了什么问题。',
  'Item not found': '找不到该物品', 'Back': '返回', 'Page not found': '找不到页面',
  'Card': '银行卡',
  'PayPal': 'PayPal',
  'Interac e-Transfer': 'Interac 电子转账',
  'Cash': '现金',
  'Accepts': '接受',
  'Protected: held until you have it': '受保护：拿到物品前款项托管',
  'Paid at the meetup, not protected': '见面时付款，不受保护',
  'Shipped orders are paid by card or PayPal so the money is held until it arrives.': '邮寄订单使用银行卡或 PayPal 付款，款项会托管到你收到为止。',
  'Payments you accept': '你接受的付款方式',
  'Shipped orders always use card or PayPal, so keep at least one of them on if you ship.': '邮寄订单只能用银行卡或 PayPal，如果你寄货，请至少保留其中一种。',
  'Held until the buyer has it. The processor keeps about 2.9% + 30¢ (estimate).': '款项托管到买家收到为止。支付公司收取约 2.9% + 30¢（估计）。',
  'Free. Paid at the meetup, not protected.': '免费。见面时付款，不受保护。',
  'Trove charges no fee. Card and PayPal processors keep about 2.9% + 30¢ of each online payment (an estimate until payments are live). Cash and e-Transfer are free.': 'Trove 不收任何费用。银行卡和 PayPal 支付公司每笔在线付款收取约 2.9% + 30¢（正式上线前为估计值）。现金和 e-Transfer 免费。',
  'Card and PayPal fees': '银行卡和 PayPal 手续费',
  'No Trove fees.': '不收 Trove 费用。',
  'Buyers pay only the price and any delivery. Cash and e-Transfer are free; card and PayPal have a small processing fee that comes out of the sale.': '买家只付价格和配送费（如有）。现金和 e-Transfer 免费；银行卡和 PayPal 有少量手续费，从售价中扣除。',
  "Trove charges no fee. Buyers pay the price plus delivery, shown before checkout. When a buyer pays by card or PayPal, the payment company keeps about 2.9% + 30¢, taken from the seller's payout. Cash and e-Transfer at a meetup are free.": 'Trove 不收任何费用。买家支付价格和配送费，结账前就会显示。买家用银行卡或 PayPal 付款时，支付公司收取约 2.9% + 30¢，从卖家的收款中扣除。见面时用现金或 e-Transfer 免费。',
  'No Trove fees to buy or sell.': '买卖都不收 Trove 费用。',
  'Install the app': '安装应用',
};

// Messages that contain a name or title the person typed
const ZH_PATTERNS = [
  [/^New question on “(.*)”\.$/, '“$1”有新问题。'],
  [/^Something you wanted was just listed: “(.*)”\.$/, '你求购的物品上架了：“$1”。'],
];

function lang() {
  try { return (Store.get().prefs.lang) || 'en'; } catch (e) { return 'en'; }
}

function tr(s) {
  if (lang() !== 'zh' || !s) return s;
  if (ZH[s]) return ZH[s];
  for (const [re, out] of ZH_PATTERNS) if (re.test(s)) return s.replace(re, out);
  return s;
}

const TRANSLATED_ATTRS = ['placeholder', 'aria-label'];

function translatePage(root) {
  const zh = lang() === 'zh';
  document.documentElement.lang = zh ? 'zh-Hans' : 'en';
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: n => n.parentElement && /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentElement.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.__en === undefined) n.__en = n.nodeValue;
    const raw = n.__en, t = raw.trim();
    if (!t) continue;
    n.nodeValue = zh ? raw.replace(t, tr(t)) : raw;
  }
  root.querySelectorAll('[placeholder],[aria-label]').forEach(el => {
    TRANSLATED_ATTRS.forEach(a => {
      if (!el.hasAttribute(a)) return;
      const key = 'en' + a.replace(/-./g, m => m[1].toUpperCase()).replace(/^./, c => c.toUpperCase());
      if (el.dataset[key] === undefined) el.dataset[key] = el.getAttribute(a);
      el.setAttribute(a, zh ? tr(el.dataset[key]) : el.dataset[key]);
    });
  });
  const btn = document.getElementById('langBtn');
  if (btn) btn.textContent = zh ? 'English' : '中文';
}

function HELP_ZH() {
  return `<div class="legal"><h1>帮助与退货</h1>
    <h2>快递购买</h2>
    <ol><li>你付款后，款项会被托管，暂不付给卖家。</li>
      <li>卖家需在 ${CONFIG.shipByDays} 天内发货，否则自动退款给你。</li>
      <li>物品送达后，你有 ${CONFIG.checkWindowDays} 天时间报告问题。</li>
      <li>之后卖家才会收到款项。</li></ol>
    <h2>当面自取</h2>
    <ol><li>预留物品，选择一个公共场所和时间。</li>
      <li>你会收到一个 6 位数的交接码。</li>
      <li>检查物品。没问题就把交接码告诉卖家；有问题就不要交易，直接取消。</li></ol>
    <p>在线付款的话，交接码会让款项放给卖家。当面付款的话，交接时付款。当面付款没有保障。</p>
    <h2>退货与退款</h2>
    <p class="notice">退货政策还是草稿，正式版本会经过审核。</p>
    <ul><li><b>未按时发货：</b>自动全额退款。</li>
      <li><b>与描述不符或损坏：</b>送达后 ${CONFIG.checkWindowDays} 天内附照片报告。可全额退款，或保留物品并部分退款。</li>
      <li>退款会退回原付款方式。</li></ul>
    <h2>费用</h2><p>买家只需支付价格和配送费，结账前会显示。没有其他费用。</p></div>`;
}

if (typeof module !== 'undefined') module.exports = { ZH, ZH_PATTERNS };
