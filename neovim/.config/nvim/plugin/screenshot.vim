"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" Screenshot Plugin
"
" Prompt the user for a file name and then launch a screen shot tool.
" That is `screencapture` on mac, and `___` on Linux.
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

" Actually build up the screen shot command and run it.
" If a second argument is given, we treat it as a number
" of seconds to pause by, before the screenshot.
function! Take_Screenshot(...) abort

    let file_name = a:1
    let cwd = expand('%:p:h')

    "TODO: Add a Linux/Unix switch here.
    let screenshot_command = 'screencapture -s ' . cwd . '/' . file_name . '.png'
    let final_command = screenshot_command

    " If we were given a time, lets use that to sleep for that long.
    " If its not a number, str2nr will return 0.
    if a:0 > 1
        let sleep_time = str2nr(a:2)
        let sleep_command = 'sleep ' . sleep_time . 's'
        let final_command = sleep_command . ' && ' . screenshot_command
    endif

    call system(final_command)
endfunction

" If we can find an image dir, lets auto complete that alongside any folders
" directly inside it.
"
" If we can't... then just don't give anything and let the user do it.
function! ImageDirComplete(arg, cli, cur_pos)
    let cwd = expand('%:p:h')
    if isdirectory(cwd . '/images')
        let image_dir_contents = glob('images/**', 0, 1)
        call filter(image_dir_contents, 'isdirectory(v:val)')

        return ['images/'] + image_dir_contents
    endif

    return []
endfunction

command! -nargs=+ -complete=customlist,ImageDirComplete Screenshot call Take_Screenshot(<f-args>)
