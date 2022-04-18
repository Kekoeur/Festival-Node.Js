let next = document.getElementById('next');
next.addEventListener('click', function () {
    let password = document.getElementById('password');
    let confirm_password = document.getElementById('confirm_password');
    let all_input = document.querySelectorAll('#part-one input');
    let empty = 0;
    all_input.forEach(i => {
        if(i.value == "" || !i.value){
            let id = i.getAttribute('id');
            document.getElementById('empty_'+id).style.display = 'block';
            empty++;
        }
    });
    if(password.value === confirm_password.value && empty == 0){
    let part_one = document.getElementById('part-one');
    let part_two = document.getElementById('part-two');
    let submit_btn = document.getElementById('submit-btn');
    part_one.style.display = "none";
    part_two.style.display = "block";
    submit_btn.style.display = "block";
    } else {
        document.getElementById('error_password').style.display = "block";
        password.value = "";
        confirm_password.value = "";
    }
})