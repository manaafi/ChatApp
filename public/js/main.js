const chatboxdom = document.getElementById("chat-form");
const roomNames = document.getElementById("room-name");
const userList = document.getElementById("users");
const socket = io();
const chatdiv = document.querySelector(".chat-messages");
const userNameLS = localStorage.getItem("username");
let roomLS = localStorage.getItem("room");
const tokenLS = localStorage.getItem("token");
let gifXhr = null;
const attachmentDropdown = document.getElementById("attachment");
const gifSearch = document.getElementById("gif-search");
const gifSearchBtn = document.getElementById("gif-search-btn");
const imageFile = document.getElementById("imageFile");
const chatForm = document.getElementById("chat-form-container");
const gifForm = document.getElementById("gif-form-container");
const cancelGifSearchBtn = document.getElementById("gif-cancel-btn");
const addRoomBtn = document.getElementById("addRoomBtn");
const addRoomName = document.getElementById("addRoomName");
const searchDropdown = document.getElementById("searchDropdown");
const searchUser = document.getElementById("searchUser");

searchUser.value = ""
attachmentDropdown.value = "dummy";

addRoomBtn.addEventListener("click", function (e) {
  e.preventDefault();
  if (addRoomName.style.display == "none") {
    var buttonIcon = document.getElementsByClassName("fas fa-plus-circle");
    buttonIcon[0].className = "fas fa-times-circle";
    addRoomName.style.display = "block";
  } else {
    var buttonIcon = document.getElementsByClassName("fas fa-times-circle");
    buttonIcon[0].className = "fas fa-plus-circle";
    addRoomName.style.display = "none";
  }
});

$("#addRoomName").keyup(function (event) {
  if (event.keyCode === 13) {
    //add room route
  }
});

cancelGifSearchBtn.addEventListener("click", function (e) {
  e.preventDefault();
  if (gifXhr != null) {
    console.log("abort call");
    gifXhr.abort();
  }
  gifForm.style.display = "none";
  attachmentDropdown.style.display = "block";
  attachmentDropdown.value = "dummy";
  chatForm.style.display = "block";
});

attachmentDropdown.addEventListener("change", function () {
  if (this.value == "gif") {
    gifForm.style.display = "block";
    imageFile.style.display = "none";
    chatForm.style.display = "none";
  } else if (this.value == "image") {
    gifForm.style.display = "none";
    imageFile.click();
    imageFile.style.display = "none";
  } else {
    gifForm.style.display = "none";
    imageFile.style.display = "none";
  }
});

let firstJoin = true;
joinRoom();

socket.on("privateRoomID", (room) => {
  console.log("privateRoomID", room)
  roomLS = room;
  localStorage.setItem("room", room)
  restoreHistory(room)
});

socket.on("msg", (message) => {
  outputMsg(message);
  chatdiv.scrollTop = chatdiv.scrollHeight;
});

chatboxdom.addEventListener("submit", (e) => {
  e.preventDefault();
  let msg = e.target.elements.msg.value;
  if (e.target.elements.imageFile.files.length) {
    socket.emit(
      "imgMessage",
      e.target.elements.imageFile.files[0],
      roomLS,
      msg
    );
  } else {
    socket.emit("chatmsg", msg, roomLS);
  }

  e.target.elements.imageFile.value = null;
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

function joinRoom(room) {
  if (room) {
    roomLS = room;
    localStorage.setItem("room", room)
    socket.emit("switchRoom", { username: userNameLS, room: roomLS });

  }
  if (firstJoin == false) {
    // socket.emit("switchRoom", { username: userNameLS, room: roomLS });
  }
  socket.emit("joinroom", { username: userNameLS, room: roomLS });
  restoreHistory(roomLS);
  socket.on("joinedUsers", ({ users }) => {
    outputUsers(users);
  });
  socket.on("currentRooms", ({ rooms }) => {
    outputRooms(rooms);
  });
  firstJoin = false;
}


function activateSearch(query) {
  // console.log(query);
  if (searchUser.value.length < 2) {
    searchDropdown.innerHTML = `<p style="color: black; ">Start typing...</p>`
    searchDropdown.style.display = "block"
  }
  if (query) {
    if (query.length > 2) {
      let data = { userName: query, token: tokenLS };
      //  console.log(data)
      searchDropdown.innerHTML = ""
      $.ajax({
        url: "http://localhost:4000/api/listallusers",
        method: "GET",
        data: data,
        contentType: "application/json",
        success: function (response) {
          // console.log("response ajax",response)
          for (i of response) {
            searchDropdown.innerHTML += `<a href='javascript:chatdiv.textContent="";joinDM("${i.email}");'>${i.email}</a><br>`
          }
        },
        error: function (xhr, status, error) {
          if (xhr.hasOwnProperty("responseJSON")) {
            console.log(xhr.responseJSON.message);
          }
          else {
            console.log(xhr);
          }
        },
      });
    }
  }
}

function joinDM(user){
  socket.emit('joinPrivateRoom', { user1: userNameLS, user2: user});
}

function restoreHistory(room) {
  let data = { room: room, token: tokenLS };
  $.ajax({
    url: "http://localhost:4000/api/retrieveHistory",
    method: "GET",
    data: data,
    contentType: "application/json",
    success: function (response) {
      for (i of response) {
        outputMsg(i);
      }
    },
    error: function (xhr, status, error) {
      if (xhr.hasOwnProperty("responseJSON")) {
        alert(xhr.responseJSON.message);
        localStorage.clear();
        window.location.href = "index.html";
      }
    },
  });
}

function outputMsg(message) {
  const timeStamp = new Date(Number(message.time));
  const toPrint = timeStamp.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const div = document.createElement("div");
  div.classList.add("message");
  if (message.asset) {
    $.ajax({
      url: "http://localhost:4000/private/" + message.asset,
      method: "GET",
      data: { token: tokenLS },
      contentType: "application/json",
      xhr: function () {
        var xhr = new XMLHttpRequest();
        xhr.responseType = "blob";
        return xhr;
      },
      success: function (response) {
        var url = window.URL || window.webkitURL;
        let image = url.createObjectURL(response);
        if (message.userName == userNameLS) {
          div.innerHTML = `<p class="meta">You <span>${toPrint}</span></p>
    <p class="text">
    <img src="${image}"><br>${message.message}
    </p>`;
          div.setAttribute("align", "right");
        } else {
          div.innerHTML = `<p class="meta">${message.userName} <span>${toPrint}</span></p>
    <p class="text">
    <img src="${image}"><br>${message.message}
    </p>`;
        }
      },
      error: function (xhr, status, error) {
        console.log("AJAX XHR", xhr);
      },
    });
  } else {
    if (message.userName == userNameLS) {
      div.innerHTML = `<p class="meta">You <span>${toPrint}</span></p>
    <p class="text">
        ${message.message}
    </p>`;
      div.setAttribute("align", "right");
    } else {
      div.innerHTML = `<p class="meta">${message.userName} <span>${toPrint}</span></p>
    <p class="text">
        ${message.message}
    </p>`;
    }
  }
  chatdiv.appendChild(div);
}

function outputRooms(rooms) {
  roomNames.textContent = ""
  for (i of rooms) {
    let roomTag = document.createElement("a");
    roomTag.style.color = "white";
    if (i == roomLS) {
      roomTag.href = `javascript:void(0);`
      roomTag.innerHTML = `<h2 style="margin-bottom: 0px;color: khaki;">${i}</h2><hr style=" visibility:hidden;">`;
      // roomNames.insertBefore(roomTag, eElement.firstChild);
      roomNames.appendChild(roomTag);

    }
    else {
      roomTag.href = `javascript:chatdiv.textContent=""; joinRoom("${i}");`
      roomTag.innerHTML = `<h2 style="margin-bottom: 0px;">${i}</h2><hr style=" visibility:hidden;">`;
      roomNames.appendChild(roomTag);
    }
  }
  roomNames.lastChild.firstChild.style.marginBottom = "10px";
}

function outputUsers(users) {
  userList.innerHTML = "";
  userList.innerHTML = `${users
    .map((user) => `<li>${user.userName}</li>`)
    .join("")}`;
}

function validateFileType() {
  var file = document.getElementById("imageFile").files[0];
  var allowedTypes = ["image/jpeg", "image/png", "image/gif"];

  if (!allowedTypes.includes(file.type)) {
    alert("Invalid file type. Please upload a JPEG, PNG, or GIF file.");
    document.getElementById("imageFile").value = "";
  }
}

$("#gif-search").on("keyup", function () {
  if (gifXhr != null) {
    gifXhr.abort();
  }
  setTimeout(() => {
    if (this.value.length > 2) {
      const query = gifSearch.value;
      data = { token: tokenLS, search: query };
      gifXhr = $.ajax({
        url: "http://localhost:4000/api/searchGifs",
        method: "GET",
        data: data,
        contentType: "application/json",
        success: function (response) {
          const gifResults = document.getElementById("gif-results");
          gifResults.innerHTML = "";
          response.forEach((gifUrl) => {
            const img = document.createElement("img");
            img.style.background =
              "transparent url('../loader.gif') center no-repeat";
            img.style.backgroundSize = "cover";
            img.src = gifUrl;
            img.onclick = function () {
              const message = `<img src="${gifUrl}"/>`;
              socket.emit("chatmsg", message, roomLS);
              document.getElementById("gif-popup").style.display = "none";
            };
            gifResults.appendChild(img);
          });
          document.getElementById("gif-popup").style.display = "block";
        },
        error: function (xhr, status, error) {
          console.log(xhr);
        },
      });
    }
  }, 2000);
});