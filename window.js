const fs = require('fs');
const csv = require('csv');

let mainWindow = null;
var now = new Date();
let totalTask = 0;
let taskCsv = fs.createReadStream('tasks.csv', {encoding: 'utf-8'});
let treeCsv = fs.createReadStream('trees.csv', {encoding: 'utf-8'});

class Task {
    constructor(parent, name, comment, hour, state, maked, limit) {
        this.parent = parent;
        this.name = name;
        this.comment = comment;
        this.hour = hour;
        this.state = state;
        this.maked = maked;
        this.limit = limit;

        // 一意なID
        this.no = ++totalTask;
    }

    Print(){
        console.log(this.parent + " / " + this.name + " " + this.hour);
    }

    MakeHtml(lv){
        var ret = '<p>';
        for (i = 0; i < lv; ++i) {
            ret += '.';
        }
        ret += '・' + this.name + ' ' + '</p>';
        return ret;
    }

    SetHour(){
        return this.hour;
    }

    GetClear(){
        if (this.state != 0) {
            return this.hour;
        }
        return 0;
    }

    MakeNode(){
        var ret = '{';
        ret += '"text": "' + this.name + '",';
        if (this.state >= 1) {
            ret += '"state":{"checked":true},';
        }
        ret += '"no":' + this.no + ',';
        ret += '"tags": ["' + this.GetClear() + " / " + this.hour + '"]';
        ret += '}';
        return ret;
    }
}

class Tree {
    constructor(id, parent, comment){
        this.id = id;
        this.parent = parent;
        this.comment = comment;
        this.children = [];
    }

    AddChild(node){
        this.children.push(node);
    }

    SetHour(){
        var ret = 0;
        this.children.forEach(function(element){
            ret += element.SetHour();
        })
        this.hour = ret;
        return ret;
    }

    GetClear(){
        var ret = 0;
        this.children.forEach(function(element){
            ret += element.GetClear();
        })
        this.clear = ret;
        return ret;
    }

    MakeHtml(lv){
        var ret = '<div class="tasks_' + lv + '"><p>';
        for (i = 0; i < lv; ++i) {
            ret += '.';
        }
        ret += this.comment + '</p>';
        this.children.forEach(function(element){
            ret += element.MakeHtml(lv + 1);
        })
        ret += '</div>';
        return ret;
    }

    MakeNode(){
        var ret = '{';
        ret += '"text": "' + this.comment + '",';
        ret += '"tags": ["' + this.clear + " / " + this.hour + '"],';
        if (this.hour == this.clear) {
            ret += '"state":{"checked":true},';
        }
        ret += '"nodes": [';
        var idx = 0;
        this.children.forEach(function(element){
            if (idx != 0){
                ret += ',';
            }
            ret += element.MakeNode();
            ++idx;
        })
        ret += ']}';
        return ret;
    }
}

// entry point

let tasks = [];
let trees = [];

function GetTree(id){
    for(i = 0; i < trees.length; ++i){
        if (trees[i].id == id){
            return trees[i];
        }
    }
    return null;
}

function GetTask(no){
    for(i = 0; i < tasks.length; ++i){
        if (tasks[i].no == no){
            return tasks[i];
        }
    }
    return null;
}


function MakeTree(){
    trees.forEach(function(element){
        if (element.parent == ""){
            element.SetHour();
            element.GetClear();
            var node = JSON.parse('[' + element.MakeNode() + ']');
            console.log(node);
            $('#tree').treeview({
                data: node,         // data is not optional
                levels: 5,
                showCheckbox: true,
                showTags: true,
                tagsClass: 'label label-default',
                backColor: 'white'
            });

            $("#tree").on("nodeChecked", function(event, node){
                if (node.no != undefined){
                    var task = GetTask(node.no);
                    if (task != null) {
                        console.log(task.state);
                        task.state = 1;
                        OutputTask();
                    }
                }
            });
            $("#tree").on("nodeUnchecked", function(event, node){
                if (node.no != undefined){
                    var task = GetTask(node.no);
                    if (task != null) {
                        console.log(task.state);
                        task.state = 0;
                        OutputTask();
                    }
                }
            });
            $("#tree").on("nodeSelected", function(event, node){
                console.log(node);
                if (node.no != undefined){
                    var task = GetTask(node.no);
                    if (task != null) {
                        $('#task_name').html(task.name);
                        $('#task_comment').html(task.comment);
                        console.log(task.limit);
                        if (task.state > 0){
                            $('#task_state').html('完了');
                        }else {
                            $('#task_state').html('未クリア');
                        }
                        $('#task_hour').html('必要工数:' + task.hour);
                        $('#task_limit').html(task.limit);
                        $('#sampleModal').modal();
                    }
                }
            });
        }
    });
}

const treeParser = csv.parse((error, data) => {
    console.log('= tree load');

    data.forEach((element, index, array) => {
        trees.push(new Tree(element[0], element[1], element[2]))
    });

    // すべての木
    trees.forEach(function(element){
        if (element.parent != ""){
            tree = GetTree(element.parent);
            if (tree != null) {
                tree.AddChild(element);
            }else{
                console.log("迷子" + element.parent);
            }
        }
    });

    tasks.forEach(function(element){
        if (element.parent != ""){
            tree = GetTree(element.parent);
            if (tree != null) {
                tree.AddChild(element);
            }else{
                console.log("迷子" + element.parent);
            }
        }
    });

    MakeTree();    
    
});

function OutputTask(){
    let newData = [];

    var date = new Date(2021, 2, 19);

    tasks.forEach(function(element){
        let row = [];
        row.push(element.parent);
        row.push(element.name);
        row.push(element.comment);
        row.push(element.hour);
        row.push(element.state);
        row.push(element.maked);
        var limit = element.limit;
        if (element.limit == 0) {
            limit = date;
        }
        row.push(limit);
        
        newData.push(row);
    });

    csv.stringify(newData,(error,output)=>{
        fs.writeFile('tasks.csv',output,(error)=>{
            if (!error){
                console.log("outputed")  
            }else{
                console.log(error);
            }
        })
    });
}

const taskParser = csv.parse((error, data) => {
    console.log('= task load');

    data.forEach((element, index, array) => {
        var state = element.length >= 5 ? Number(element[4]) : 0;
        var maked = element.length >= 6 ? element[5] : 0;
        var limit = element.length >= 7 ? element[6] : 0;
        tasks.push(new Task(element[0], element[1], element[2], Number(element[3]), state, maked, limit));
    })
    treeCsv.pipe(treeParser);
})

taskCsv.pipe(taskParser);

$('#make').on('click', function() {
    OutputTask();
});

$('#newTaskButton').on('click', function() {
    var str = "";
    trees.forEach(function(element){
        str += '<li><button class="dropdown-item clear-decoration" value="' + element.id + '">' + element.id + '</button></li>';
    });
    $('#taskList').html(str);
    $('#taskParentInput').html('all');
    $('#newTaskWindow').modal();
});

$(function(){
    $(document).on("click", '.dropdown-menu .dropdown-item', function(){
        var visibleItem = $('.dropdown-toggle', $(this).closest('.dropdown'));
        visibleItem.text($(this).attr('value'));
    });
});

$('#addTask').on('click', function() {
    var parent = $('#taskParentInput').html();
    var name = $('#taskNameInput').val();
    var comment = $('#taskCommentInput').val();
    var hour = Number($('#taskHourInput').val());
    if (hour <= 0){
        hour = 1;
    }
    var task = new Task(parent, name, comment, hour, 0, 0, 0);
    tasks.push(task);
    if (parent != ""){
        tree = GetTree(parent);
        tree.AddChild(task);
    }
    MakeTree();
    OutputTask();
});