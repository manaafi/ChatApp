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
const newGroupBtn = document.getElementById("newGroupBtn");
const dropdownMenu = document.getElementById('dropdownMenu')
const addUsers = document.getElementById('addUsers')

searchUser.value = ""
attachmentDropdown.value = "dummy";

if (tokenLS) {
  $.ajax({
    url: "http://localhost:4000/api/tokenCheck",
    method: "POST",
    data: JSON.stringify({ token: tokenLS }),
    contentType: "application/json",
    success: function (response) {
      return;
    },
    error: function (xhr, status, error) {
      console.log(xhr)
      xhr.responseJSON ? alert(xhr.responseJSON.message) : null
      localStorage.clear()
      window.location.href = 'index.html'
    }
  })
} else {
  window.location.href = 'index.html'
}

document.getElementById("newGroupForm").addEventListener('submit', function (event) {
  event.preventDefault();
  const allUsersAdded = selectedUsers.getElementsByTagName("a");
  if (!allUsersAdded.length) {
    alert("Please add at least one user to the group");
    return
  }
  let users = [];
  for (let i = 0; i < allUsersAdded.length; i++) {
    users.push(allUsersAdded[i].textContent);
  }
  users.push(userNameLS);
  socket.emit('createGroup', { groupName: document.getElementById("groupName").value, groupUsers: users })
})

document.getElementById('dropdownMenuButton').addEventListener('click', function (event) {
  event.stopPropagation();
  dropdownMenu.style.display = 'block';
});

window.addEventListener('click', function () {
  if (searchUser == document.activeElement || dropdownMenu == document.activeElement) {
    return;
  }
  dropdownMenu.style.display = 'none';
  searchDropdown.style.display = "none";
});


// newGroupBtn.addEventListener('click', function () {
//   if(document.getElementById('newGroupName').style.display == 'none'){
//     document.getElementById('newGroupName').style.display = 'unset';
//     document.getElementById('cancelNewGroup').style.display = 'unset';
//   }
//   else{
//     document.getElementById('newGroupName').style.display = 'none';
//     document.getElementById('cancelNewGroup').style.display = 'none';
//     return
//   }
// });

newGroupBtn.addEventListener('click', function () {
  if (document.getElementById('newGroupPopup').style.display == 'none') {
    document.getElementById('newGroupPopup').style.display = 'unset';
  }
  else {
    document.getElementById('newGroupPopup').style.display = 'none';
    return
  }
});

document.getElementById("cancelNewGroup").addEventListener('click', function () {
  document.getElementById('newGroupPopup').style.display = 'none';
  selectedUsers.innerHTML = "";
  // document.getElementById('cancelNewGroup').style.display = 'none';
});

// document.getElementById("cancelNewGroup").addEventListener('click', function () {
//   document.getElementById('newGroupName').style.display = 'none';
//   document.getElementById('cancelNewGroup').style.display = 'none';
// });

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
  if (event.key === "Enter") {
    if (addRoomName.value) {
      const data = { userName: userNameLS, room: addRoomName.value, token: tokenLS }
      $.ajax({
        url: "http://localhost:4000/api/addRoom",
        method: "POST",
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function (response) {
          alert(response.message)
          joinRoom(data.room);

        },
        error: function (xhr, status, error) {
          alert(xhr.responseJSON.message)
        }
      })
      addRoomBtn.click()
    }

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

// let firstJoin = true;
joinRoom();

socket.on("privateRoomID", (room) => {
  roomLS = room;
  localStorage.setItem("room", room);
  restoreHistory(room)
});

socket.on("msg", (message) => {
  outputMsg(message);
  chatdiv.scrollTop = chatdiv.scrollHeight;
});

chatboxdom.addEventListener("submit", (e) => {
  if (roomLS == "018b954f-fd29-726a-9a5e-f7586c0e47a3") {
    return;
  }
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

socket.on("currentRooms", ({ rooms }) => {
  outputRooms(rooms);
});
socket.on("joinedUsers", async ({ users }) => {
  await outputUsers(users);
});
socket.on("onlinePing", async ({ user }) => {
  await outputUsers(user, true);
});
socket.on("offlinePing", async ({ user }) => {
  await outputUsers(user, false);
});

function joinRoom(room) {
  let currentOpenUser = userList.querySelector('li[style="font-weight: bold;"]');
  if (currentOpenUser) {
    currentOpenUser.removeAttribute('style');
  }
  if (room) {
    roomLS = room;
    localStorage.setItem("room", room)
    socket.emit("switchRoom", userNameLS, roomLS, (response) => {
      console.log("response", response);
      restoreHistory(roomLS);
      outputRooms(response);
    });
  }
  // if (firstJoin == false) {
  //   // socket.emit("switchRoom", { username: userNameLS, room: roomLS });
  // }
  else if (!roomLS || roomLS == "018b954f-fd29-726a-9a5e-f7586c0e47a3") {
    outputMsg({ userName: "Admin", message: "Welcome! Start chatting by joining/creating a room, or by finding a friend using the search bar above.", time: Date.now() })
    outputRooms([], true)
    socket.emit("joinroom", { userName: userNameLS, room: "018b954f-fd29-726a-9a5e-f7586c0e47a3" })
  }
  else {
    socket.emit("joinroom", { userName: userNameLS, room: roomLS });
    restoreHistory(roomLS);
  }

  // firstJoin = false;
}


function activateSearch(query, newGroupContext) {
  const currentTextbox = document.activeElement
  // console.log(query);
  // searchDropdown should be positioned below currentTextBox
  searchDropdown.style.top = currentTextbox.offsetTop + currentTextbox.offsetHeight + "px"
  if (currentTextbox.value.length <= 2) {
    searchDropdown.innerHTML = `<p style="color: black; ">Start typing...</p>`
    searchDropdown.style.display = "block"
    return
  }
  searchDropdown.style.display = "block"
  if (query) {
    // if (query.length > 2) {
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
        let selfEmail = ""
        for (i of response) {
          if (i.email == userNameLS) {
            selfEmail = newGroupContext ? "" : `<a href='javascript:joinDM("${i.email}");'>${i.email} (You)</a><br>`
          }
          else {
            newGroupContext ? searchDropdown.innerHTML += `<a href='javascript:newGroupMembersHandler("${i.email}");'>${i.email}</a><br>` : searchDropdown.innerHTML += `<a href='javascript:joinDM("${i.email}");'>${i.email}</a><br>`
          }
        }
        searchDropdown.innerHTML = selfEmail + searchDropdown.innerHTML
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
    // }
  }
}

function newGroupMembersHandler(user) {
  addUsers.value = "";
  const allUsersAdded = selectedUsers.getElementsByTagName("a");

  for (let i = 0; i < allUsersAdded.length; i++) {
    if (allUsersAdded[i].textContent == user) {
      alert("User already added");
      return
    }
  }
  const newMember = document.createElement("a");
  newMember.innerHTML = user + "<br>";
  newMember.addEventListener("mouseover", function () {
    newMember.innerText = user + " (click to remove)\n";
    newMember.style.color = "red";
  });
  newMember.addEventListener("mouseout", function () {
    newMember.innerText = user + "\n";
    newMember.style.color = "";
  });
  newMember.addEventListener("click", function () {
    newMember.remove();
  });
  selectedUsers.appendChild(newMember);
  

  // document.getElementById("selectedUsers").innerHTML += `<a>${user}</a><br>`;
  // const selectedUser = document.querySelector(`#selectedUsers a:last-child`);
  // selectedUser.addEventListener("mouseover", function() {
  //   selectedUser.innerText = `${user} (click to remove)`;
  //   selectedUser.style.color = "red";
  // });

  // selectedUser.addEventListener("mouseout", function() {
  //   selectedUser.innerText = user;
  //   selectedUser.style.color = "";
  // });

  searchDropdown.style.display = "none";
}



function joinDM(user) {
  // let currentOpenUser = userList.querySelector('li[style="font-weight: bold;"]');
  // if(currentOpenUser){
  //   currentOpenUser.removeAttribute('style');
  // } 
  // listItems = userList.getElementsByTagName("li");
  // for (let i = 0 ; i <= listItems.length; i++) {
  //   const listElement = listItems[i]
  //   if(listElement.innerText == user || listElement.innerText == user + " ●"){
  //     listElement.setAttribute("style", "font-weight: bold;")
  //   }
  // };
  // console.log(listItems);
  searchDropdown.style.display = "none";
  socket.emit('joinPrivateRoom', { user1: userNameLS, user2: user });

}

function restoreHistory(room) {
  chatdiv.innerHTML = ""
  // console.log("restoreHistory", room)
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
      alert("ERROR")
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

async function isPrivateChat(room) {
  let ret = false;
  return await new Promise(function (myResolve, myReject) {
    socket.emit("roomIDcheck", room, (response) => {
      // console.log("callback", response)
      ret = response.status
      // console.log("isPrivateChat", ret)
      myResolve(ret);
    });
  });
}

async function outputRooms(rooms, firstLogin) {
  roomNames.textContent = ""
  // console.log("outputRooms", rooms)
  let roomTag = document.createElement("a");
  roomTag.style.color = "white";
  if (firstLogin || !rooms.length) {
    roomTag.href = `javascript:void(0);`
    roomTag.innerHTML = `<h2 style="margin-bottom: 0px;">Join or create a room using the add button above</h2><hr style=" visibility:hidden;">`;
    roomNames.appendChild(roomTag);
  }
  for (let i of rooms) {

    // console.log("outputRooms i", i)

    if (await isPrivateChat(i)) {
      // console.log("continued", i)
      continue;
    }
    // console.log("not continued", i)

    else if (i == roomLS) {
      roomTag.href = `javascript:void(0);`
      roomTag.innerHTML = `<h2 style="margin-bottom: 0px;color: khaki;">${i}</h2><hr style=" visibility:hidden;">`;
      // roomNames.insertBefore(roomTag, eElement.firstChild);
      // roomNames.appendChild(roomTag);
    }
    // else if(i == "018b954f-fd29-726a-9a5e-f7586c0e47a3"){
    //   roomTag.innerHTML = `<h2 style="margin-bottom: 0px;color: khaki;">Welcome!</h2><hr style=" visibility:hidden;">`;
    // }
    else {
      roomTag.href = `javascript:chatdiv.textContent=""; joinRoom("${i}");`
      roomTag.innerHTML = `<h2 style="margin-bottom: 0px;">${i}</h2><hr style=" visibility:hidden;">`;
    }
    roomNames.appendChild(roomTag);
  }
  roomNames.lastChild ? roomNames.lastChild.firstChild.style.marginBottom = "10px" : null
}

async function outputUsers(users, onlineFlag) {
  // console.log("Users", users)
  // userList.innerHTML = "";
  listItems = userList.getElementsByTagName("li");
  if (typeof users == 'string') {
    // if (onlineFlag) {
    for (let i = 0; i < listItems.length; i++) {
      if (onlineFlag ? listItems[i].textContent == users : listItems[i].textContent == users + " ●") {
        onlineFlag ? listItems[i].innerHTML = users + '<span class = "online"> ●</span>' : listItems[i].innerHTML = users;
      }
    }
    // }
    return
  }
  let isLastChatPrivate = await isPrivateChat(roomLS)
  if (isLastChatPrivate) {
    const lastTextedUser = isLastChatPrivate.users.filter(user => user != userNameLS);
    // console.log("lastTextedUser", lastTextedUser[0])
    userList.innerHTML = `${users[1].map((user) => {
      if (user.length > 1 && typeof user != "string"){
        return `<a style="color: white;" href="javascript:void(0);"><li>Group: ${user[0]}</li></a>`
      }
      if (users[0].includes(user)) {
        if (user == lastTextedUser[0]) {
          return `<li style='font-weight: bold;'>${user}<span class = 'online'> ●</span></li>`
        }
        return `<a style="color: white;" href="javascript:joinDM('${user}');"><li>${user}<span class = "online"> ●</span></li></a>`
      }
      else {
        if (user == lastTextedUser[0]) {
          return `<li style='font-weight: bold;'>${user}</li>`
        }
        return `<a style="color: white;" href="javascript:joinDM('${user}');"><li>${user}</li></a>`
      }
    }).join("")}`;
  }
  else {
    userList.innerHTML = `${users[1].map((user) => {
      if (users[0].includes(user)) {
        return `<a style="color: white;" href="javascript:joinDM('${user}');"><li>${user}<span class = "online"> ●</span></li></a>`
      }
      else { return `<a style="color: white;" href="javascript:joinDM('${user}');"><li>${user}</li></a>` }
    }).join("")}`;
  }
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