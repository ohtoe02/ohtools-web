import type { DeclarativeCopy } from "../lib/declarative/reference";

export const declarativeCopy: DeclarativeCopy = {
  "os-fact": {
    en: {
      title: "OS facts",
      summary: "Read a bounded operating-system profile for later checks.",
      exampleYaml: `- name: Read host profile
  os_fact:
    register: host`,
    },
    ru: {
      title: "Факты ОС",
      summary: "Читает ограниченный профиль операционной системы для проверок.",
      exampleYaml: `- name: Прочитать профиль хоста
  os_fact:
    register: host`,
    },
  },
  "file-fact": {
    en: {
      title: "File facts",
      summary: "Inspect a path without following an untrusted symlink.",
      exampleYaml: `- name: Inspect configuration
  file_fact:
    path: /etc/example/app.conf
    register: app_config`,
    },
    ru: {
      title: "Факты файла",
      summary: "Проверяет путь без перехода по недоверенной символьной ссылке.",
      exampleYaml: `- name: Проверить конфигурацию
  file_fact:
    path: /etc/example/app.conf
    register: app_config`,
    },
  },
  assert: {
    en: {
      title: "Assertion",
      summary: "Turn collected facts into explicit operator-facing checks.",
      exampleYaml: `- name: Require Debian
  assert:
    fact: host.id
    equals: debian
    message: This runbook requires Debian`,
    },
    ru: {
      title: "Утверждение",
      summary: "Преобразует собранные факты в явные операторские проверки.",
      exampleYaml: `- name: Требовать Debian
  assert:
    fact: host.id
    equals: debian
    message: Этот runbook требует Debian`,
    },
  },
  directory: {
    en: {
      title: "Directory",
      summary: "Converge a protected directory and verify its metadata.",
      exampleYaml: `- name: Create application directory
  directory:
    path: /etc/example
    state: present
    owner: root
    group: root
    mode: "0755"`,
    },
    ru: {
      title: "Каталог",
      summary:
        "Приводит защищённый каталог и его метаданные к заданному состоянию.",
      exampleYaml: `- name: Создать каталог приложения
  directory:
    path: /etc/example
    state: present
    owner: root
    group: root
    mode: "0755"`,
    },
  },
  file: {
    en: {
      title: "File",
      summary:
        "Manage file content from a sealed asset or restricted template.",
      exampleYaml: `- name: Install configuration
  file:
    path: /etc/example/app.conf
    state: present
    asset: assets/app.conf
    mode: "0644"
    notify: [restart-example]`,
    },
    ru: {
      title: "Файл",
      summary:
        "Управляет файлом из запечатанного ресурса или ограниченного шаблона.",
      exampleYaml: `- name: Установить конфигурацию
  file:
    path: /etc/example/app.conf
    state: present
    asset: assets/app.conf
    mode: "0644"
    notify: [restart-example]`,
    },
  },
  apt: {
    en: {
      title: "APT packages",
      summary:
        "Converge a bounded package list through trusted apt executables.",
      exampleYaml: `- name: Install runtime packages
  apt:
    packages: [ca-certificates, curl]
    state: present`,
    },
    ru: {
      title: "Пакеты APT",
      summary:
        "Управляет ограниченным списком пакетов через доверенные утилиты apt.",
      exampleYaml: `- name: Установить системные пакеты
  apt:
    packages: [ca-certificates, curl]
    state: present`,
    },
  },
  systemd: {
    en: {
      title: "Systemd unit",
      summary: "Converge active and enabled state, with deferred handlers.",
      exampleYaml: `- name: Keep nginx active
  systemd:
    unit: nginx.service
    state: started
    enabled: true`,
    },
    ru: {
      title: "Юнит systemd",
      summary: "Управляет активностью и автозапуском с отложенными handlers.",
      exampleYaml: `- name: Поддерживать nginx активным
  systemd:
    unit: nginx.service
    state: started
    enabled: true`,
    },
  },
  sysctl: {
    en: {
      title: "Sysctl setting",
      summary: "Converge one kernel value through an ohtools-owned drop-in.",
      exampleYaml: `- name: Enable IPv4 forwarding
  sysctl:
    name: net.ipv4.ip_forward
    value: "1"
    state: present`,
    },
    ru: {
      title: "Параметр sysctl",
      summary:
        "Управляет параметром ядра через drop-in, принадлежащий ohtools.",
      exampleYaml: `- name: Включить маршрутизацию IPv4
  sysctl:
    name: net.ipv4.ip_forward
    value: "1"
    state: present`,
    },
  },
};
