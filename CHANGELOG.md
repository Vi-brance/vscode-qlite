# Change Log

All notable changes to the "vscode-qlite" extension will be documented in this file.

## [Unreleased]
- 自 **v1.3** 开始将放缓对聊天页面的美化（js现学现用，能力有限），重心转移到vscode相关操作的优化上

## [Unsolved]
- 视频消息需要额外的组件处理才能在线浏览，暂未实装

## [1.3.7] - 2023-03-01

### Added
- 在聊天窗口底部与最后一条消息添加一段间隔，美化显示效果

### Fixed
- 再次更改消息同步逻辑，私聊中发送出去的消息/文件将会在发送完毕（上传到服务器）时获取到消息的其他信息并将消息/文件显示在聊天窗口中

## [1.3.6] - 2023-01-28

### Added
- 支持移除消息栏中的新消息
- 添加侧边栏好友/群头像显示

### Fixed
- 修复快捷切换账号后消息栏的消息不刷新的bug

### Changed
- 合并查看好友/群资料的命令

### Removed
- 移除登录提示

## [1.3.5] - 2023-01-23

### Added
- 无登录账号时显示欢迎界面，现通过欢迎界面登录账号
- 支持多账号的快捷切换，登录后右上角的设置按钮中的账号切换功能可列出在此扩展中登陆成功过的所有账号
- 添加空资料界面，后续添加对应好友/群信息显示

### Changed
- 修改侧边栏的设置按钮功能，取消其中的登录功能，在登录后支持账号切换和状态切换，退出功能在账号切换的子选项中

## [1.3.4] - 2023-01-18

### Added
- 好友聊天现在支持文件发送功能，群聊的文件管理较复杂，后续跟进
- 添加手动刷新聊天消息的功能，发送文件可能不会立刻显示发送的文件消息，目前只能手动刷新或重新打开聊天界面才能解决
- 侧边栏支持右键好友/群查看好友/群资料，对应功能暂未实装

### Fixed
- 修复文件消息的获取和下载功能
- 修复消息查重可能失误的bug

## [1.3.3] - 2023-01-14

### Fixed
- 修复无法有效点击工具栏内容的bug
- 修复输入框编辑多行文本时发送无法识别换行符的bug

## [1.3.2] - 2023-01-14

### Fixed
- 修复发送图片无法在消息中正常显示的bug
- 修复连续点击不同的工具栏按钮时前一个工具栏不会消失的bug

### Changed
- 更换消息页面工具栏的按钮样式，并美化了样式
- 优化了小程序分享的json消息的显示效果

## [1.3.1] - 2023-01-14

### Fixed
- 修复上一版本中私聊消息无法加载的bug

## [1.3.0] - 2023-01-13

### Added
- 现在支持双击消息栏昵称和点击输入框上方的`@`按钮AT其他人，AT词条会加入到输入框中，可以组合其他内容发送
- 从 <a href="https://github.com/sysnapse/vscode-qq-console-theme">sysnapse</a> 大佬魔改自前扩展的console主题页面搬运了解析更多qq消息类型的功能：对json消息的解析，视频消息的预览，文件消息对文件名和大小的显示。但以上功能并未作相关测试，希望使用相关功能的用户能反馈一下显示效果

### Changed
- 优化了整个页面的代码结构（终于完完整整地读完旧代码了）和注释，尽力作了模块化，大佬可视情况魔改
- 发送键同步win端的QQ默认按键，Enter发送消息，Shift+Enter换行，后续可能会实现用户自定义

### Removed
- 移除了群聊中消息头像旁的菜单按钮，计划将相关功能分散到其他部分

## [1.2.8] - 2023-01-12

### Changed
- 漫游表情栏的图片排列顺序改为由新到旧的顺序

### Fixed
- 修复发送大图时本地无法正常显示的bug

## [1.2.7] - 2023-01-11

### Added
- 添加双击消息框中图片能放大查看的功能，单击放大后的图片即可退出

### Changed
- 修改聊天框中表情大小，与文字高度一致

### Fixed
- 修复发送表情失败的问题

## [1.2.6] - 2023-01-10

### Changed
- 优化表情栏的显示效果

### Fixed
- 修复群聊中的at功能，现在能通过

  - 点击其他人消息中的at链接
  - 点击头像旁的`...`，在选项框中选择`@AT`
  - 双击消息中的昵称
  
  来at其他人

### Removed
- 由于oicq已弃用回复消息的功能，因此本扩展也删除了该功能

## [1.2.5] - 2023-01-09

### Fixed
- 修复通知提示功能
- 修复群聊发送消息重复显示的问题

## [1.2.4] - 2023-01-09

### Fixed
- 修复输入框粘贴html格式文本时带格式粘贴导致无法发送消息的问题

## [1.2.3] - 2023-01-09

### Added
- 添加输入框按钮的交互效果
- 现在通过拖动分割线可以改变两个容器的显示比例

### Changed
- 美化表情工具栏的显示效果

### Removed
- 移除emoji工具栏
- 移除粘贴图片工具栏（通过`ctrl+v`直接粘贴）

## [1.2.2] - 2023-01-09

### Added
- 当浏览历史聊天记录（窗口离底部有一段距离）时收到新消息不再滑动窗口到底部
- 上划获取历史记录时将停留在当前记录位置

### Changed
- 将消息的序列号信息合并到消息块中，减少页面冗余

### Fixed
- 修复私聊时聊天界面显示昵称的问题

## [1.2.1] - 2023-01-08

### Added
- 输入框支持发送qq表情和漫游表情

## [1.2.0] - 2023-01-08

### Added
- 输入框支持发送粘贴的图片

### Changed
- 输入框升级为富文本框，可显示粘贴的图片和文字

## [1.1.4] - 2023-01-08

### Changed
- 重绘聊天输入框，恢复了读取漫游表情的功能，但没完全恢复（因为还不能发送）

## [1.1.3] - 2023-01-07

### Changed
- 修改css文件，优化消息显示效果

### Fixed
- 修复消息中表情与文本不对齐的问题

## [1.1.2] - 2023-01-06

### Changed
- 聊天图片从链接改为直接显示

## [1.1.1] - 2023-01-06

### Added
- 为登陆选项添加小图标，优化了显示效果

### Changed
- 修改搜索功能的显示效果

## [1.1.0] - 2023-01-05

### Added
- 添加好友和群聊的搜索功能

### Fixed
- 修复新群友加群时也会出现提示的问题

## [1.0.3] - 2023-01-05

### Added
- 添加登出账号的二次确认窗口

### Changed
- 账号为离线状态时侧边栏设置为空

## [1.0.2] - 2023-01-04

### Added
- 切换账号需要二次确认

### Changed
- 修改聊天窗口图标为自定义

### Fixed
- 修复当前聊天窗口收到消息时侧边栏显示新消息的问题

## [1.0.1] - 2023-01-04

### Fixed
- 修复消息内容和头衔显示错误的问题

## [1.0.0] - 2023-01-04

### Added
- 实现侧边栏新消息加入消息列表功能

## [0.3.1] - 2023-01-04

### Added
- 添加了对好友增减时的消息通知
- 添加了对群头衔变化时的消息通知

## [0.3.0] - 2023-01-04

### Added
- 实现了群增减时的消息通知和侧边栏信息同步更新功能

## [0.2.4] - 2023-01-03

### Changed
- 修改群聊中的头衔名显示

### Deprecated
- 计划删除头像放大预览功能

## [0.2.3] - 2023-01-03

### Added
- 添加消息同步功能（原扩展已实现）

### Changed
- 修改页面缓存的数据类型，使其能够按key索引
- 将向页面发送事件的子函数（PostPrivateEvent、PostGroupEvent）整合到绑定消息事件函数（bind）中

## [0.2.2] - 2023-01-02

### Fixed
- 统一设置私聊对话不显示昵称，群聊显示群友昵称

## [0.2.1] - 2023-01-02

### Fixed
- 修复私聊窗口中对话误添加title的问题

## [0.2.0] - 2023-01-02

### Changed
- 重新匹配types中webview中所有函数的接口，将统一从客户端类调用函数拆分为分别从私聊类和群聊类调用各自的函数
- 重写聊天界面对网页端发送的信息的处理函数，由于函数调用对象更改，获取历史记录的参数将不再需要msg_id，因此删除对此函数的特别处理
- 聊天窗口的预处理js文件中重写了api列表，重新分配对应的函数功能，其中在群聊中将不实例化私聊特有的函数，反之亦然，以免产生参数冲突
- 聊天窗口的js文件中对于加载群成员列表的函数改为promise调用形式
- 由于获取历史记录等功能不再需要msg_id，因此将其全部替换为seq，即消息序号
- 将原函数api更新为新api列表中的函数

### Removed
- 移除聊天窗口的js文件中不必要的变量声明（移除的变量都能直接从webview类中调用）
- 原代码中发送消息会返回发送状态，但oicq2.0中返回信息删减，无法作相应处理，因此暂时对该部分代码作注释处理

## [0.1.1] - 2022-12-31

### Changed
- 更新聊天界面中获取用户昵称的方法

### Fixed
- 修复原扩展中群资料读取失败的问题

## [0.1.0] - 2022-12-31

### Added
- 添加配置文件读写功能，实现自动登录上次的账号
- 添加账号扫码登陆
- 添加登录状态改变选项
- 添加切换账号选项
- 添加登出选项

## Changed
- 修改默认的README文件，公开代码仓库

## Removed
- 移除vsc-extension-quickstart.md文件

## Fixed
- 修复原扩展中无法加载历史聊天记录的问题

## [0.0.2] - 2022-12-29

### Added
- 添加原webview相关文件，初步修复新版本oicq的历史消息读取功能

## [0.0.1] - 2022-12-25

### Added
- 完成基础的QQ登录行为
- 实现QQ联系人列表的读取、分组和动态树视图展示
