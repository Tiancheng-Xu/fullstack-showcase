---
title: "Overreacted 阅读路线"
type: "reading-route"
status: "阅读路线已整理，逐篇带读进行中"
reviewed: "2026-10-02"
catalog_verified: "2026-10-01"
source: "https://overreacted.io/"
source_author: "Dan Abramov"
tags:
  - "技术文章"
  - "学习路线"
  - "JavaScript"
  - "React"
---

# Overreacted 阅读路线

从 JavaScript 的基本概念出发，逐步进入 React 的运行方式、工程设计、React Server Components（React 服务器组件，RSC），再扩展到开放社交协议、编程语言与技术表达。这篇笔记整理的是学习路线和阅读方法，适合用来决定先学什么、每一步应该学到什么。

## 路线依据与当前状态

文章来源为 Dan Abramov 的 [Overreacted](https://overreacted.io/)。路线依据 2026-10-01 核对的博客目录和已建立的带读方案整理；七个阶段的分组与顺序是整理者的学习建议，不是作者提供的课程大纲。

目前已建立阅读路线，逐篇带读刚从 JavaScript 基础开始。路线整理完成不代表所有原文已经精读，也不代表这里已有每篇文章的内容总结。后续阅读产生的理解、例子和结论，会另行整理成有依据的笔记。

## 第一阶段：JavaScript 基础

### 对应文章

1. [What Is JavaScript Made Of?](https://overreacted.io/what-is-javascript-made-of/)
2. [On let vs const](https://overreacted.io/on-let-vs-const/)
3. [Why Do We Write super(props)?](https://overreacted.io/why-do-we-write-super-props/)
4. [How Does React Tell a Class from a Function?](https://overreacted.io/how-does-react-tell-a-class-from-a-function/)

先弄清值、变量、对象和对象身份，再进入作用域、函数、闭包、原型与类。这里的目标是建立能推演代码的基础，而不是先记住一串术语。

每次遇到赋值、对象修改或函数调用，都先预测程序会发生什么，再运行小例子验证。完成这一阶段时，应能解释“变量重新赋值”和“修改对象属性”的区别，并用代码说明两个名字是否指向同一个对象。这些概念也是理解 React 状态与组件行为的起点。

## 第二阶段：React 组件与 Hooks

### 对应文章

1. [The Elements of UI Engineering](https://overreacted.io/the-elements-of-ui-engineering/)
2. [React as a UI Runtime](https://overreacted.io/react-as-a-ui-runtime/)
3. [How Does setState Know What to Do?](https://overreacted.io/how-does-setstate-know-what-to-do/)
4. [Why Do React Elements Have a $$typeof Property?](https://overreacted.io/why-do-react-elements-have-typeof-property/)
5. [Why Do React Hooks Rely on Call Order?](https://overreacted.io/why-do-hooks-rely-on-call-order/)
6. [How Are Function Components Different from Classes?](https://overreacted.io/how-are-function-components-different-from-classes/)
7. [A Complete Guide to useEffect](https://overreacted.io/a-complete-guide-to-useeffect/)
8. [Making setInterval Declarative with React Hooks](https://overreacted.io/making-setinterval-declarative-with-react-hooks/)
9. [Why Isn’t X a Hook?](https://overreacted.io/why-isnt-x-a-hook/)
10. [Writing Resilient Components](https://overreacted.io/writing-resilient-components/)
11. [Before You memo()](https://overreacted.io/before-you-memo/)
12. [My Wishlist for Hot Reloading](https://overreacted.io/my-wishlist-for-hot-reloading/)

按渲染、状态更新、组件行为、Hooks、Effect 和性能优化的顺序推进。先理解组件在什么情况下运行、一次渲染拿到什么，再讨论副作用和优化方式。

练习围绕小组件展开：描述它的状态，预测更新后显示什么，检查 Effect 的触发条件。学习产出应包括能解释的小例子，以及对常见误解的说明。性能优化放在能够说明问题之后，先明确优化对象和判断依据。

## 第三阶段：工程设计与调试

### 对应文章

1. [What Are the React Team Principles?](https://overreacted.io/what-are-the-react-team-principles/)
2. [Optimized for Change](https://overreacted.io/optimized-for-change/)
3. [The “Bug-O” Notation](https://overreacted.io/the-bug-o-notation/)
4. [Goodbye, Clean Code](https://overreacted.io/goodbye-clean-code/)
5. [The WET Codebase](https://overreacted.io/the-wet-codebase/)
6. [npm audit: Broken by Design](https://overreacted.io/npm-audit-broken-by-design/)
7. [How Does the Development Mode Work?](https://overreacted.io/how-does-the-development-mode-work/)
8. [Suppressions of Suppressions](https://overreacted.io/suppressions-of-suppressions/)
9. [How to Fix Any Bug](https://overreacted.io/how-to-fix-any-bug/)

阅读重点从某个 API 转向设计取舍：为什么一个抽象有用，哪些变化会让它变得难维护，怎样缩小故障范围，怎样评估工具给出的警告。

每篇阅读都配一个自己的项目问题，记录“原来的困难—文章提出的思路—适用条件—验证结果”。涉及历史版本、工具行为或个人偏好时，保留当年的语境，并核对今天的官方资料。目标是形成可以说明理由的工程判断。

## 第四阶段：React Server Components

### 对应文章

1. [A Chain Reaction](https://overreacted.io/a-chain-reaction/)
2. [The Two Reacts](https://overreacted.io/the-two-reacts/)
3. [React for Two Computers](https://overreacted.io/react-for-two-computers/)
4. [JSX Over The Wire](https://overreacted.io/jsx-over-the-wire/)
5. [Impossible Components](https://overreacted.io/impossible-components/)
6. [What Does "use client" Do?](https://overreacted.io/what-does-use-client-do/)
7. [Functional HTML](https://overreacted.io/functional-html/)
8. [RSC for Astro Developers](https://overreacted.io/rsc-for-astro-developers/)
9. [Static as a Server](https://overreacted.io/static-as-a-server/)
10. [One Roundtrip Per Navigation](https://overreacted.io/one-roundtrip-per-navigation/)
11. [Why Does RSC Integrate with a Bundler?](https://overreacted.io/why-does-rsc-integrate-with-a-bundler/)
12. [Progressive JSON](https://overreacted.io/progressive-json/)
13. [RSC for LISP Developers](https://overreacted.io/rsc-for-lisp-developers/)
14. [How Imports Work in RSC](https://overreacted.io/how-imports-work-in-rsc/)
15. [Introducing RSC Explorer](https://overreacted.io/introducing-rsc-explorer/)

先建立服务器与客户端分工的整体认识，再阅读两端通信、组件组合、模块边界、序列化、流式传输和构建工具之间的关系。

这一阶段适合用一张小图追踪数据和代码：哪些工作在服务器完成，哪些交互留在客户端，边界上交换什么。每次只展开一个机制，直到可以用自己的话说明一个页面如何组成和更新，再进入下一层。

## 第五阶段：开放社交协议

### 对应文章

1. [Open Social](https://overreacted.io/open-social/)
2. [Where It's at://](https://overreacted.io/where-its-at/)
3. [A Social Filesystem](https://overreacted.io/a-social-filesystem/)
4. [There Are No Instances in atproto](https://overreacted.io/there-are-no-instances-in-atproto/)

从应用使用者的视角扩展到协议视角，逐步阅读账号身份、数据托管、内容分发和应用之间的关系，认识 atproto（Authenticated Transfer Protocol）的设计讨论。

阅读时区分协议机制、作者主张和实际产品行为。学习产出是能说明“身份、数据和应用分别由谁负责”的关系图，以及仍需查证的问题。涉及当前功能或兼容性时，继续回到协议和产品的官方文档核对。

## 第六阶段：编程语言、数学与证明

### 对应文章

1. [Algebraic Effects for the Rest of Us](https://overreacted.io/algebraic-effects-for-the-rest-of-us/)
2. [The Math Is Haunted](https://overreacted.io/the-math-is-haunted/)
3. [Beyond Booleans](https://overreacted.io/beyond-booleans/)
4. [A Lean Syntax Primer](https://overreacted.io/a-lean-syntax-primer/)
5. [How I Vibed a Proof of Conway’s Conjecture](https://overreacted.io/how-i-vibed-a-proof-of-conways-conjecture/)

这一组涉及代数效应、类型、Lean 和形式化证明等新概念，阅读节奏需要更慢。先读懂一个最小例子，再增加一条规则，逐步理解问题如何被表达。

每次记录输入条件、希望证明或表达的目标，以及工具验证了哪一步。能够复述例子的前提与结论后，再尝试修改例子。这里的进度以理解和验证为准，不以读过多少页面为准。

## 第七阶段：表达、职业与个人随笔

### 对应文章

1. [Things I Don’t Know as of 2018](https://overreacted.io/things-i-dont-know-as-of-2018/)
2. [Fix Like No One’s Watching](https://overreacted.io/fix-like-no-ones-watching/)
3. [Coping with Feedback](https://overreacted.io/coping-with-feedback/)
4. [Name It, and They Will Come](https://overreacted.io/name-it-and-they-will-come/)
5. [Preparing for a Tech Talk, Part 1: Motivation](https://overreacted.io/preparing-for-tech-talk-part-1-motivation/)
6. [Preparing for a Tech Talk, Part 2: What, Why, and How](https://overreacted.io/preparing-for-tech-talk-part-2-what-why-and-how/)
7. [Preparing for a Tech Talk, Part 3: Content](https://overreacted.io/preparing-for-tech-talk-part-3-content/)
8. [My Decade in Review](https://overreacted.io/my-decade-in-review/)
9. [I'm Doing a Little Consulting](https://overreacted.io/im-doing-a-little-consulting/)
10. [Hire Me in Japan](https://overreacted.io/hire-me-in-japan/)

把技术阅读延伸到如何讲清一个想法、组织演讲、接受反馈和认识自己的知识边界。可以与前面阶段交错阅读，不必等技术部分全部结束。

每篇提炼一个能够实践的动作，例如先说明听众的问题、缩短一个解释，或明确标注自己尚未验证的判断。个人经历和建议保留其主观性，再根据自己的场景决定是否采用。

## 每次怎样读

1. 先用一句话写出本段要解决的问题，限定本次阅读范围。
2. 保留关键英文术语，用中文说明它与已有知识的关系。
3. 给出一个小例子；有代码时先预测，再运行验证。
4. 用一道理解题检查是否能解释原因，长文按段落继续。
5. 收尾记录已理解的内容、未解决的问题和下一段起点。

学习记录区分“已建立路线”“开始阅读”“完成某一段”和“完成全文回顾”。只有完成文章阅读并能回述主要问题、例子和适用边界，才标记为读完。

## 如何持续补充

阅读项目负责推进逐篇带读并整理内容。分享中的本篇路线笔记只在阶段安排或阅读方法有实质变化时更新；新的精读笔记按实际完成的内容单独收录，并标明来源与整理日期。
