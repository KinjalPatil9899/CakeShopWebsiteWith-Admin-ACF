function myTextlowercase() {
  var field_label = document.getElementById("field_label").value;
  let result = field_label.replaceAll(' ', '_').toLowerCase();
  //alert(result);
  document.getElementById("field_name").value = result;
}
function myTextlowercaseRep() {
  var field_label = document.getElementById("repeater_field_label").value;
  let result = field_label.replaceAll(' ', '_').toLowerCase();
  //alert(result);
  document.getElementById("repeater_field_name").value = result;
}
function myFunction() {
  var field_type_id = document.getElementById("field_type_id").value;
  console.log(field_type_id);
  if(field_type_id == "8"){
    document.getElementById("customRepeater").style.display = "flex";
  } else {
    document.getElementById("customRepeater").style.display = "none";
  }
  if(field_type_id == "9"){
    document.getElementById("tab_id_div").style.display = "none";
  } else {
    document.getElementById("tab_id_div").style.display = "flex";
  }
}

window.onload = function(){
  myFunction();

  const items = document.querySelectorAll('.item');
  const columns = document.querySelectorAll(".column");

  items.forEach(item => {
      item.addEventListener('dragstart', dragStart)
      item.addEventListener('dragend', dragEnd)
  });

  columns.forEach((column) => {
      new Sortable(column, {
          group: "shared",
          animation: 150,
          ghostClass: "hide"
      });
  });
}

let dragItem = null;

function dragStart() {
  console.log('drag started');
  dragItem = this;
  let title  = $(this).data("title");
  console.log(title);
  setTimeout(() => this.className = 'invisible', 0)
}

// function dragDrop() {
//   console.log('drag dropped');
//   this.append(dragItem);
// }

// function dragOver(e) {
//   e.preventDefault()
//   console.log('drag over');
// }
// function dragEnter() {
//   console.log('drag entered');
// }
// function dragLeave() {
//   console.log('drag left');
// }

function dragEnd() {
  console.log('drag ended');
  this.className = 'item'
  dragItem = null;
}