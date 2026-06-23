// ClasseBook - app principale
// ca devrait marcher je crois

(function () {
  var K = {
    users: "cb-users",
    session: "cb-session",
    feed: "cb-feed",
    photos: "cb-photos",
    polls: "cb-polls",
    votes: "cb-votes",
    moments: "cb-moments",
    settings: "cb-settings",
    device: "cb-device-id",
    title: "cb-title",
  };

  var EMOJIS = [
    "👍", "👎", "❤️", "💔", "😂", "🤣", "😍", "😡", "😢", "😮", "🤔", "😎",
    "🔥", "💩", "👏", "🙄", "😬", "🤡", "💀", "🥶", "🤯", "😴", "🫡", "🤝",
    "⭐", "💯", "🎉", "👑", "🍕", "⚽", "📚", "🎓", "💪", "🦄", "🐸", "👻",
    "🤖", "💅", "✨", "🌈", "🫶", "😇", "🤓", "😈", "🥳", "🤮", "👀", "💤",
  ];

  var AVATARS = ["😎", "🤓", "😊", "🥳", "🦊", "🐱", "🦄", "👻", "🤖", "💅"];

  var DEFAULT_POLLS = [
    { id: "p1", title: "⭐ Plus populaire", official: true },
    { id: "p2", title: "🏆 Meilleur prof", official: true },
    { id: "p3", title: "😬 Pire prof", official: true },
    { id: "p4", title: "💕 Chouchou des nanas", official: true },
    { id: "p5", title: "🎖️ Meilleur délégué", official: true },
  ];

  var QUICK_REACT = ["👍", "👎", "❤️", "😂", "😡", "🔥"];

  var users = [];
  var feed = [];
  var photos = [];
  var polls = [];
  var voteData = { tallies: {}, userVotes: {} };
  var moments = [];
  var settings = { endDate: "2026-06-30" };
  var me = null;
  var pickAvatar = "😎";
  var emojiTarget = null; // input id ou {type, id}
  var emojiMode = "text"; // text | react | comment-react
  var photoData = null;

  // --- storage basique ---
  function load(key, def) {
    try {
      var r = localStorage.getItem(key);
      return r ? JSON.parse(r) : def;
    } catch (e) {
      return def;
    }
  }
  function save(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }
  function id() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function getDeviceId() {
    var d = localStorage.getItem(K.device);
    if (!d) {
      d = "dev-" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(K.device, d);
    }
    return d;
  }

  function getDeviceLabel() {
    var ua = navigator.userAgent;
    if (/iPhone|iPad/i.test(ua)) return "📱 iPhone/iPad";
    if (/Android/i.test(ua)) return "📱 Android";
    if (/Windows/i.test(ua)) return "💻 Windows PC";
    if (/Mac/i.test(ua)) return "💻 Mac";
    if (/Linux/i.test(ua)) return "💻 Linux";
    return "🖥️ Autre appareil";
  }

  function fmtDate(ts) {
    return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  function isAdmin(u) {
    return u && u.admin;
  }

  function canDelete(item) {
    if (!me) return false;
    if (isAdmin(me)) return true;
    return item.userId == me.id;
  }

  // --- init data ---
  function loadAll() {
    users = load(K.users, []);
    feed = load(K.feed, []);
    photos = load(K.photos, []);
    polls = load(K.polls, DEFAULT_POLLS);
    voteData = load(K.votes, { tallies: {}, userVotes: {} });
    moments = load(K.moments, []);
    settings = load(K.settings, { endDate: "2026-06-30" });
    me = load(K.session, null);
    if (me) {
      var u = users.find(function (x) { return x.id == me.id; });
      if (u) me = { id: u.id, name: u.name, avatar: u.avatar, admin: u.admin };
    }
  }

  function saveAll() {
    save(K.users, users);
    save(K.feed, feed);
    save(K.photos, photos);
    save(K.polls, polls);
    save(K.votes, voteData);
    save(K.moments, moments);
    save(K.settings, settings);
    if (me) save(K.session, me);
    else localStorage.removeItem(K.session);
  }

  // --- auth sans mdp ---
  function needLogin() {
    if (!me) {
      document.getElementById("auth-modal").classList.remove("hidden");
      return false;
    }
    return true;
  }

  function renderAuth() {
    var guest = document.getElementById("auth-guest");
    var user = document.getElementById("auth-user");
    if (me) {
      guest.classList.add("hidden");
      user.classList.remove("hidden");
      var badge = me.avatar + " " + me.name;
      if (isAdmin(me)) badge += " <span class='admin-tag'>ADMIN</span>";
      document.getElementById("user-badge").innerHTML = badge;
    } else {
      guest.classList.remove("hidden");
      user.classList.add("hidden");
    }
    document.getElementById("photo-form-card").classList.toggle("hidden", !me);
    document.getElementById("photo-login-hint").classList.toggle("hidden", me);
    document.getElementById("menu-admin").classList.toggle("hidden", !isAdmin(me));
  }

  function initAvatars() {
    var box = document.getElementById("avatar-pick");
    box.innerHTML = "";
    AVATARS.forEach(function (a) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "av-btn" + (a == pickAvatar ? " on" : "");
      b.textContent = a;
      b.onclick = function () {
        pickAvatar = a;
        box.querySelectorAll(".av-btn").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
      };
      box.appendChild(b);
    });
    document.getElementById("device-preview").textContent = "Ton appareil : " + getDeviceLabel();
  }

  document.getElementById("btn-join").onclick = function () {
    document.getElementById("auth-modal").classList.remove("hidden");
    initAvatars();
  };

  document.getElementById("auth-form").onsubmit = function (e) {
    e.preventDefault();
    var name = document.getElementById("auth-name").value.trim();
    var err = document.getElementById("auth-err");
    var devId = getDeviceId();
    var devLabel = getDeviceLabel();

    var exist = users.find(function (u) { return u.name.toLowerCase() == name.toLowerCase(); });

    if (exist) {
      if (exist.deviceId != devId) {
        err.textContent = "Ce pseudo est déjà pris sur " + exist.deviceLabel + ". Quelqu'un fait le malin avec ton nom ?";
        err.classList.remove("hidden");
        return;
      }
      me = { id: exist.id, name: exist.name, avatar: exist.avatar, admin: exist.admin };
    } else {
      var nu = {
        id: id(),
        name: name,
        avatar: pickAvatar,
        deviceId: devId,
        deviceLabel: devLabel,
        admin: users.length == 0,
        created: Date.now(),
      };
      users.push(nu);
      me = { id: nu.id, name: nu.name, avatar: nu.avatar, admin: nu.admin };
    }
    err.classList.add("hidden");
    saveAll();
    document.getElementById("auth-modal").classList.add("hidden");
    renderAuth();
    renderMenuInfo();
  };

  document.getElementById("btn-logout").onclick = function () {
    me = null;
    saveAll();
    renderAuth();
  };

  // --- tabs ---
  document.querySelectorAll(".tab").forEach(function (btn) {
    btn.onclick = function () {
      document.querySelectorAll(".tab").forEach(function (b) { b.classList.remove("active"); });
      document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });
      btn.classList.add("active");
      document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    };
  });

  // --- menu ---
  document.getElementById("btn-menu").onclick = function () {
    document.getElementById("side-menu").classList.remove("hidden");
    renderMenuInfo();
    if (isAdmin(me)) {
      document.getElementById("admin-end-date").value = settings.endDate;
    }
  };

  document.querySelectorAll("[data-close]").forEach(function (el) {
    el.onclick = function () {
      el.closest(".side-menu, .modal").classList.add("hidden");
    };
  });

  function renderMenuInfo() {
    var box = document.getElementById("menu-user-info");
    if (!me) {
      box.innerHTML = "<p>Pas connecté</p>";
      return;
    }
    var u = users.find(function (x) { return x.id == me.id; });
    box.innerHTML =
      "<p>" + me.avatar + " <strong>" + me.name + "</strong></p>" +
      "<p class='post-device'>📍 " + (u ? u.deviceLabel : getDeviceLabel()) + "</p>" +
      (isAdmin(me) ? "<p>👑 Tu es admin</p>" : "");
  }

  document.getElementById("admin-save-date").onclick = function () {
    if (!isAdmin(me)) return;
    settings.endDate = document.getElementById("admin-end-date").value;
    saveAll();
    updateCountdown();
    alert("Date sauvée !"); // debutant style
  };

  document.getElementById("admin-add-poll").onclick = function () {
    if (!isAdmin(me)) return;
    var inp = document.getElementById("admin-poll-title");
    inp.classList.toggle("hidden");
    if (!inp.classList.contains("hidden")) {
      inp.focus();
      inp.onkeydown = function (e) {
        if (e.key == "Enter") {
          var t = inp.value.trim();
          if (t) {
            polls.push({ id: id(), title: t, official: true });
            saveAll();
            renderPolls();
            inp.value = "";
            inp.classList.add("hidden");
          }
        }
      };
    }
  };

  // --- emojis ---
  function initEmojiGrid() {
    var grid = document.getElementById("emoji-grid");
    grid.innerHTML = "";
    EMOJIS.forEach(function (em) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "emoji-btn";
      b.textContent = em;
      b.onclick = function () { applyEmoji(em); };
      grid.appendChild(b);
    });
  }

  document.getElementById("emoji-custom").oninput = function () {
    var v = this.value;
    if (v) applyEmoji(v.slice(-2));
  };

  document.querySelectorAll(".btn-emoji").forEach(function (btn) {
    btn.onclick = function () {
      emojiMode = "text";
      emojiTarget = btn.dataset.target;
      document.getElementById("emoji-panel").classList.remove("hidden");
    };
  });

  document.getElementById("emoji-close").onclick = function () {
    document.getElementById("emoji-panel").classList.add("hidden");
    emojiMode = "text";
    emojiTarget = null;
  };

  function applyEmoji(em) {
    if (emojiMode == "react" && emojiTarget) {
      addReaction(emojiTarget.store, emojiTarget.id, em);
      document.getElementById("emoji-panel").classList.add("hidden");
      return;
    }
    if (emojiMode == "comment-react" && emojiTarget) {
      addCommentReaction(emojiTarget.store, emojiTarget.postId, emojiTarget.commentId, em);
      document.getElementById("emoji-panel").classList.add("hidden");
      return;
    }
    if (emojiTarget) {
      var el = document.getElementById(emojiTarget);
      if (el) {
        el.value += em;
        el.focus();
      }
    }
    document.getElementById("emoji-panel").classList.add("hidden");
  }

  function openReactPicker(store, itemId) {
    emojiMode = "react";
    emojiTarget = { store: store, id: itemId };
    document.getElementById("emoji-panel").classList.remove("hidden");
  }

  // --- reactions ---
  function addReaction(store, itemId, emoji) {
    if (!needLogin()) return;
    var list = store == "feed" ? feed : photos;
    var item = list.find(function (x) { return x.id == itemId; });
    if (!item) return;
    if (!item.reactions) item.reactions = {};
    if (item.reactions[me.id] == emoji) delete item.reactions[me.id];
    else item.reactions[me.id] = emoji;
    saveAll();
    if (store == "feed") renderFeed();
    else renderPhotos();
  }

  function addCommentReaction(store, postId, commentId, emoji) {
    if (!needLogin()) return;
    var list = store == "feed" ? feed : photos;
    var post = list.find(function (x) { return x.id == postId; });
    if (!post || !post.comments) return;
    var c = post.comments.find(function (x) { return x.id == commentId; });
    if (!c) return;
    if (!c.reactions) c.reactions = {};
    if (c.reactions[me.id] == emoji) delete c.reactions[me.id];
    else c.reactions[me.id] = emoji;
    saveAll();
    if (store == "feed") renderFeed();
    else renderPhotos();
  }

  function renderReactionBar(store, item) {
    var wrap = document.createElement("div");
    wrap.className = "reactions";

    QUICK_REACT.forEach(function (em) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "react-btn";
      b.textContent = em;
      b.onclick = function () { addReaction(store, item.id, em); };
      wrap.appendChild(b);
    });

    var custom = document.createElement("button");
    custom.type = "button";
    custom.className = "react-btn react-pick";
    custom.textContent = "➕ perso";
    custom.onclick = function () { openReactPicker(store, item.id); };
    wrap.appendChild(custom);

    var counts = document.createElement("div");
    counts.className = "react-counts";
    if (item.reactions) {
      var tally = {};
      Object.values(item.reactions).forEach(function (em) {
        tally[em] = (tally[em] || 0) + 1;
      });
      Object.keys(tally).forEach(function (em) {
        var chip = document.createElement("span");
        chip.className = "react-chip";
        chip.textContent = em + " " + tally[em];
        counts.appendChild(chip);
      });
    }
    wrap.appendChild(counts);
    return wrap;
  }

  function renderComments(store, item, container) {
    var sec = document.createElement("div");
    sec.className = "comments";
    if (item.comments) {
      item.comments.forEach(function (c) {
        var div = document.createElement("div");
        div.className = "comment";
        div.innerHTML = "<strong>" + c.avatar + " " + c.name + "</strong> " + c.text;
        var cr = document.createElement("div");
        cr.className = "comment-react";
        QUICK_REACT.slice(0, 4).forEach(function (em) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "react-btn";
          b.style.fontSize = "0.7rem";
          b.textContent = em;
          b.onclick = function () { addCommentReaction(store, item.id, c.id, em); };
          cr.appendChild(b);
        });
        var plus = document.createElement("button");
        plus.type = "button";
        plus.className = "react-btn";
        plus.style.fontSize = "0.65rem";
        plus.textContent = "+";
        plus.onclick = function () {
          emojiMode = "comment-react";
          emojiTarget = { store: store, postId: item.id, commentId: c.id };
          document.getElementById("emoji-panel").classList.remove("hidden");
        };
        cr.appendChild(plus);
        if (c.reactions) {
          var tally = {};
          Object.values(c.reactions).forEach(function (em) { tally[em] = (tally[em] || 0) + 1; });
          Object.keys(tally).forEach(function (em) {
            var s = document.createElement("span");
            s.className = "react-chip";
            s.textContent = em + tally[em];
            cr.appendChild(s);
          });
        }
        div.appendChild(cr);
        sec.appendChild(div);
      });
    }
    var form = document.createElement("form");
    form.className = "comment-form";
    form.innerHTML = "<input placeholder='Commentaire…' maxlength='120'><button type='submit'>→</button>";
    form.onsubmit = function (e) {
      e.preventDefault();
      if (!needLogin()) return;
      var inp = form.querySelector("input");
      var t = inp.value.trim();
      if (!t) return;
      if (!item.comments) item.comments = [];
      item.comments.push({
        id: id(),
        userId: me.id,
        name: me.name,
        avatar: me.avatar,
        text: t,
        reactions: {},
        ts: Date.now(),
      });
      inp.value = "";
      saveAll();
      if (store == "feed") renderFeed();
      else renderPhotos();
    };
    sec.appendChild(form);
    container.appendChild(sec);
  }

  // --- FEED ---
  document.getElementById("feed-type").onchange = function () {
    document.getElementById("feed-target").classList.toggle("hidden", this.value != "mur");
  };

  document.getElementById("feed-form").onsubmit = function (e) {
    e.preventDefault();
    if (!needLogin()) return;
    var type = document.getElementById("feed-type").value;
    var text = document.getElementById("feed-text").value.trim();
    var target = document.getElementById("feed-target").value.trim();
    if (!text) return;
    if (type == "mur" && !target) {
      alert("Mets un nom pour le mur !");
      return;
    }
    var u = users.find(function (x) { return x.id == me.id; });
    feed.push({
      id: id(),
      type: type,
      userId: me.id,
      name: me.name,
      avatar: me.avatar,
      deviceLabel: u ? u.deviceLabel : getDeviceLabel(),
      target: target,
      text: text,
      reactions: {},
      comments: [],
      ts: Date.now(),
    });
    document.getElementById("feed-text").value = "";
    document.getElementById("feed-target").value = "";
    saveAll();
    renderFeed();
  };

  function renderFeed() {
    var list = document.getElementById("feed-list");
    list.innerHTML = "";
    var empty = document.getElementById("feed-empty");
    var sorted = feed.slice().sort(function (a, b) { return b.ts - a.ts; });
    if (!sorted.length) {
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");

    sorted.forEach(function (p) {
      var el = document.createElement("article");
      el.className = "post";
      var tag = p.type == "mur" ? "<span class='post-tag'>Mur · " + p.target + "</span>" : "<span class='post-tag'>Livre d'or</span>";
      el.innerHTML =
        "<div class='post-head'>" +
        "<span class='post-av'>" + p.avatar + "</span>" +
        "<div class='post-meta'><div class='post-name'>" + p.name + "</div>" +
        "<div class='post-device'>" + p.deviceLabel + " · " + fmtDate(p.ts) + "</div>" + tag + "</div>" +
        (canDelete(p) ? "<button type='button' class='del-btn'>×</button>" : "") +
        "</div>";
      if (p.type == "mur") {
        el.innerHTML += "<p class='post-body'><span class='post-target'>" + p.target + "</span> — " + p.text + "</p>";
      } else {
        el.innerHTML += "<p class='post-body'>" + p.text + "</p>";
      }
      var del = el.querySelector(".del-btn");
      if (del) del.onclick = function () {
        feed = feed.filter(function (x) { return x.id != p.id; });
        saveAll();
        renderFeed();
      };
      el.appendChild(renderReactionBar("feed", p));
      renderComments("feed", p, el);
      list.appendChild(el);
    });
  }

  // --- PHOTOS ---
  document.getElementById("photo-pick").onclick = function () {
    document.getElementById("photo-file").click();
  };

  document.getElementById("photo-file").onchange = function (e) {
    var file = e.target.files[0];
    if (!file || file.size > 1500000) {
      alert("Image trop grosse (max 1.5mb)");
      return;
    }
    var reader = new FileReader();
    reader.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        var c = document.createElement("canvas");
        var w = img.width, h = img.height;
        if (w > 700) { h = h * 700 / w; w = 700; }
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        photoData = c.toDataURL("image/jpeg", 0.8);
        var prev = document.getElementById("photo-prev");
        prev.src = photoData;
        prev.classList.remove("hidden");
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  document.getElementById("photo-form-card").onsubmit = function (e) {
    e.preventDefault();
    if (!needLogin()) return;
    if (!photoData) {
      alert("Choisis une photo avant !");
      return;
    }
    var u = users.find(function (x) { return x.id == me.id; });
    photos.push({
      id: id(),
      userId: me.id,
      name: me.name,
      avatar: me.avatar,
      deviceLabel: u ? u.deviceLabel : getDeviceLabel(),
      image: photoData,
      caption: document.getElementById("photo-cap").value.trim(),
      reactions: {},
      comments: [],
      ts: Date.now(),
    });
    photoData = null;
    document.getElementById("photo-prev").classList.add("hidden");
    document.getElementById("photo-cap").value = "";
    saveAll();
    renderPhotos();
  };

  function renderPhotos() {
    var list = document.getElementById("photo-list");
    list.innerHTML = "";
    var sorted = photos.slice().sort(function (a, b) { return b.ts - a.ts; });
    sorted.forEach(function (p) {
      var el = document.createElement("article");
      el.className = "post";
      el.innerHTML =
        "<div class='post-head'><span class='post-av'>" + p.avatar + "</span>" +
        "<div class='post-meta'><div class='post-name'>" + p.name + "</div>" +
        "<div class='post-device'>" + p.deviceLabel + " · " + fmtDate(p.ts) + "</div></div>" +
        (canDelete(p) ? "<button type='button' class='del-btn'>×</button>" : "") + "</div>" +
        "<img class='post-img' src='" + p.image + "' alt='photo'>" +
        (p.caption ? "<p class='post-body'>" + p.caption + "</p>" : "");
      var del = el.querySelector(".del-btn");
      if (del) del.onclick = function () {
        photos = photos.filter(function (x) { return x.id != p.id; });
        saveAll();
        renderPhotos();
      };
      el.appendChild(renderReactionBar("photos", p));
      renderComments("photos", p, el);
      list.appendChild(el);
    });
  }

  // --- POLLS ---
  document.getElementById("poll-create").onsubmit = function (e) {
    e.preventDefault();
    if (!needLogin()) return;
    var t = document.getElementById("poll-title").value.trim();
    if (!t) return;
    polls.push({ id: id(), title: t, official: false, by: me.name });
    document.getElementById("poll-title").value = "";
    saveAll();
    renderPolls();
  };

  function renderPolls() {
    var box = document.getElementById("poll-list");
    box.innerHTML = "";
    polls.forEach(function (poll) {
      var card = document.createElement("div");
      card.className = "poll-card" + (poll.official ? " official" : "");
      var tallies = voteData.tallies[poll.id] || {};
      var entries = Object.keys(tallies).map(function (k) { return [k, tallies[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
      var total = entries.reduce(function (s, e) { return s + e[1]; }, 0);
      var myVote = me && voteData.userVotes[me.id] ? voteData.userVotes[me.id][poll.id] : null;

      var html = "<div class='poll-title'>" + poll.title + "</div>";
      if (!myVote) {
        html += "<form class='poll-form' data-pid='" + poll.id + "'>" +
          "<input placeholder='Nom à voter…' maxlength='40' required>" +
          "<button type='submit' class='btn-sm'>Voter</button></form>";
      } else {
        html += "<p class='poll-voted'>Tu as voté : " + myVote + "</p>";
      }
      entries.slice(0, 5).forEach(function (e) {
        var pct = total ? Math.round(e[1] / total * 100) : 0;
        html += "<div class='poll-bar'><span>" + e[0] + "</span><div class='poll-track'><div class='poll-fill' style='width:" + pct + "%'></div></div><span>" + pct + "%</span></div>";
      });
      card.innerHTML = html;
      box.appendChild(card);

      var form = card.querySelector(".poll-form");
      if (form) {
        form.onsubmit = function (ev) {
          ev.preventDefault();
          if (!needLogin()) return;
          var inp = form.querySelector("input");
          var name = inp.value.trim();
          if (!name) return;
          if (!voteData.userVotes[me.id]) voteData.userVotes[me.id] = {};
          voteData.userVotes[me.id][poll.id] = name;
          if (!voteData.tallies[poll.id]) voteData.tallies[poll.id] = {};
          voteData.tallies[poll.id][name] = (voteData.tallies[poll.id][name] || 0) + 1;
          saveAll();
          renderPolls();
        };
      }
    });
  }

  // --- COUNTDOWN ---
  function daysUntil(dateStr) {
    var end = new Date(dateStr + "T23:59:59");
    var now = new Date();
    var diff = end - now;
    return Math.max(0, Math.ceil(diff / 86400000));
  }

  function updateCountdown() {
    var d = daysUntil(settings.endDate);
    document.getElementById("days-left").textContent = d;
    document.getElementById("countdown-big").textContent = d + " jours";
    document.getElementById("end-date-label").textContent = "Fin d'année : " + settings.endDate;
  }

  document.getElementById("moment-form").onsubmit = function (e) {
    e.preventDefault();
    if (!needLogin()) return;
    var title = document.getElementById("moment-title").value.trim();
    var date = document.getElementById("moment-date").value;
    if (!title || !date) return;
    moments.push({ id: id(), title: title, date: date, by: me.name, ts: Date.now() });
    document.getElementById("moment-title").value = "";
    document.getElementById("moment-date").value = "";
    saveAll();
    renderMoments();
  };

  function renderMoments() {
    var ul = document.getElementById("moment-list");
    ul.innerHTML = "";
    moments.sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
    moments.forEach(function (m) {
      var li = document.createElement("li");
      var days = daysUntil(m.date);
      li.innerHTML = "<span>" + m.title + " <small>(" + m.by + ")</small></span><span class='moment-days'>" + days + " j</span>";
      if (isAdmin(me) || (me && m.by == me.name)) {
        var del = document.createElement("button");
        del.className = "del-btn";
        del.textContent = "×";
        del.onclick = function () {
          moments = moments.filter(function (x) { return x.id != m.id; });
          saveAll();
          renderMoments();
        };
        li.appendChild(del);
      }
      ul.appendChild(li);
    });
  }

  // --- title ---
  var titleEl = document.getElementById("class-title");
  var savedTitle = localStorage.getItem(K.title);
  if (savedTitle) titleEl.textContent = savedTitle;
  titleEl.onblur = function () {
    localStorage.setItem(K.title, titleEl.textContent.trim() || "Notre classe");
  };

  // --- init ---
  console.log("ClasseBook loaded ok"); // oups débutant
  loadAll();
  initAvatars();
  initEmojiGrid();
  renderAuth();
  renderFeed();
  renderPhotos();
  renderPolls();
  updateCountdown();
  renderMoments();
})();
