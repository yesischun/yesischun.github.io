(() => {
  'use strict';
  const translations = {
    navWork: ['Selected work', '精选项目'], navAbout: ['About', '关于'], navContact: ['Contact', '联系'],
    heroEyebrow: ['AUTONOMOUS DRIVING / SCENARIO INTELLIGENCE', '自动驾驶 / 场景智能'],
    heroTitle1: ['Engineering', '探索场景，'], heroTitle2: ['the ', '理解'], heroTitle3: ['unexpected.', '未知。'],
    intro: ['I’m Yichun Ye at Tongji University. I explore how intelligent scenarios can shape the way autonomous vehicles learn and are evaluated.', '我是 Yichun Ye，来自同济大学。我关注如何通过智能场景，改进自动驾驶系统的学习与评估。'],
    exploreWork: ['Explore my work', '探索我的研究'], heroNote: ['LEARNING SYSTEMS. TESTING POSSIBILITIES.', '让系统学习，让可能性接受检验。'],
    sceneExplore: ['One scene. Many possible futures.', '一个场景，多种可能的未来。'], sceneEvaluate: ['Explore the distribution of possibilities.', '探索可能性的分布。'], sceneEvolve: ['Search. Inherit. Refine.', '搜索、继承、迭代。'],
    modeExplore: ['Explore', '探索'], modeEvaluate: ['Evaluate', '评估'], modeEvolve: ['Evolve', '进化'], concept: ['CONCEPT VISUAL', '原理示意'],
    focusLabel: ['RESEARCH FOCUS', '研究方向'], focus1: ['Scenario intelligence', '场景智能'], focus2: ['Evolutionary learning', '演化学习'], focus3: ['Safety evaluation', '安全评估'],
    workEyebrow: ['01 / SELECTED WORK', '01 / 精选项目'], workTitle: ['Ideas, made executable.', '让想法成为可运行的代码。'],
    workIntro: ['Open-source explorations at the intersection of scenarios, learning, and evaluation.', '围绕场景、学习与评估，持续探索并开源。'],
    ltsTag: ['EVOLUTIONARY TRAINING', '演化训练策略'],
    ltsDesc: ['What if the training strategy could evolve, too? A framework that searches for autonomous-driving curricula through Lamarckian evolution, then distills them into a reusable training strategy.', '如果训练策略本身也能进化，会发生什么？通过拉马克式演化搜索自动驾驶课程，再将搜索经验蒸馏为可复用的训练策略。'],
    viewProject: ['Explore the repository', '查看开源仓库'], flowTag: ['PROBABILITY-AWARE TESTING', '概率感知测试'],
    flowDesc: ['Exploring the scenarios that matter for safety. A testing environment connecting joint scene–behavior modeling, normalizing flows, and importance sampling for autonomous-driving evaluation.', '探索对安全有意义的场景。将场景—行为联合建模、归一化流与重要性采样相结合，构建自动驾驶安全评估环境。'],
    infraLabel: ['RESEARCH INFRASTRUCTURE', '研究基础设施'], infraDesc: ['Scenario sampling, curriculum evolution, policy training, and reproducible evaluation.', '支持场景采样、课程进化、策略训练与可复现评估。'],
    aboutEyebrow: ['02 / RESEARCH PERSPECTIVE', '02 / 研究视角'], aboutTitle: ['Better questions.<br>Better scenarios.', '好的问题，<br>带来更好的场景。'],
    affiliation: ['Tongji University', '同济大学 · Tongji University'],
    aboutLead: ['The scenarios we choose shape what our systems learn—and what we know about them.', '我们选择怎样的场景，决定了系统能学到什么，也影响着我们如何理解它。'],
    aboutBody: ['My work connects scenario-driven learning with probability-aware evaluation for autonomous driving. I’m interested in how to construct useful training experiences, explore meaningful possibilities, and make evaluation evidence easier to interpret.', '我的研究围绕自动驾驶的场景驱动学习与概率感知评估展开。我关注如何构建有价值的训练经历、探索有意义的可能性，以及如何让评估证据更容易被理解。'],
    question1: ['What should a system experience?', '系统应该经历怎样的场景？'], question1Body: ['Scenario generation and curriculum design.', '场景生成与课程设计。'],
    question2: ['How can learning strategies evolve?', '训练策略如何持续进化？'], question2Body: ['Evolutionary search and reusable training strategies.', '演化搜索与可复用的训练策略。'],
    question3: ['What does the evidence tell us?', '评估证据究竟说明了什么？'], question3Body: ['Probability-aware testing and reproducible evaluation.', '概率感知测试与可复现评估。'],
    contactEyebrow: ['03 / LET’S CONNECT', '03 / 联系交流'], contactTitle1: ['New questions.', '新的问题，'], contactTitle2: ['Shared curiosity.', '共同探索。'],
    contactText: ['Interested in autonomous driving, scenario intelligence, or learning systems? Let’s exchange ideas.', '如果你也关注自动驾驶、场景智能或学习系统，欢迎交流想法。'],
    copyEmail: ['Copy email', '复制邮箱'], footerMotto: ['Stay curious. Build with intent.', '保持好奇，认真构建。'], backTop: ['Back to top ↑', '返回顶部 ↑']
  };
  let language = 'en';
  try { language = localStorage.getItem('portfolio-language') === 'zh' ? 'zh' : 'en'; } catch (_) {}
  let mode = 'explore';
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motionPreference.matches;
  const languageButton = document.getElementById('language-toggle');
  const motionButton = document.getElementById('motion-toggle');
  const copyButton = document.getElementById('copy-email');
  let copyTimer;
  function updateMotion() {
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', language === 'zh' ? (paused ? '播放动画' : '暂停动画') : (paused ? 'Play animation' : 'Pause animation'));
    document.getElementById('motion-symbol').textContent = paused ? '▷' : 'Ⅱ';
    window.scenarioScene?.setPaused(paused);
  }
  function updateLanguage() {
    const index = language === 'zh' ? 1 : 0;
    document.documentElement.lang = index ? 'zh-CN' : 'en';
    for (const element of document.querySelectorAll('[data-i18n]')) {
      const entry = translations[element.dataset.i18n];
      if (!entry) continue;
      if (element.dataset.i18n === 'aboutTitle') {
        element.replaceChildren();
        entry[index].split('<br>').forEach((text, i) => {
          if (i) element.appendChild(document.createElement('br'));
          element.appendChild(document.createTextNode(text));
        });
      } else element.textContent = entry[index];
    }
    languageButton.innerHTML = (index ? 'EN' : '中文') + ' <span aria-hidden="true">↗</span>';
    languageButton.setAttribute('aria-label', index ? 'Switch to English' : '切换到中文');
    copyButton.setAttribute('aria-label', index ? '复制邮箱地址' : 'Copy email address');
    document.querySelector('.skip-link').textContent = index ? '跳转到主要内容' : 'Skip to content';
    document.getElementById('scene-description').textContent = translations['scene' + mode[0].toUpperCase() + mode.slice(1)][index];
    updateMotion();
  }
  languageButton.addEventListener('click', () => {
    language = language === 'en' ? 'zh' : 'en';
    try { localStorage.setItem('portfolio-language', language); } catch (_) {}
    updateLanguage();
  });
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    window.scenarioScene?.setMode(mode);
    updateLanguage();
  }));
  motionButton.addEventListener('click', () => { paused = !paused; updateMotion(); });
  motionPreference.addEventListener('change', event => { paused = event.matches; updateMotion(); });
  copyButton.addEventListener('click', async () => {
    clearTimeout(copyTimer);
    const zh = language === 'zh';
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText('2610276@tongji.edu.cn');
      copyButton.querySelector('span').textContent = zh ? '已复制' : 'Copied';
      document.getElementById('copy-status').textContent = zh ? '邮箱地址已复制到剪贴板' : 'Email address copied to clipboard';
    } catch (_) {
      copyButton.querySelector('span').textContent = zh ? '请选中上方邮箱复制' : 'Select the email above to copy';
      document.getElementById('copy-status').textContent = zh ? '无法访问剪贴板，请选中上方邮箱手动复制' : 'Clipboard access unavailable. Select the email above to copy manually.';
    }
    copyTimer = setTimeout(() => { copyButton.querySelector('span').textContent = translations.copyEmail[language === 'zh' ? 1 : 0]; }, 3500);
  });
  document.getElementById('year').textContent = new Date().getFullYear();
  updateLanguage();
})();
