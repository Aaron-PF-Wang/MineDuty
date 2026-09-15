import sys,pygame,importlib
def countingSpace(list):
    _list = list.lstrip('   ')
    _listS=_list.split(' ')
    if len(_list)>=2:
        while _listS[-1]=='':
            _listS.pop(-1)
    return (len(list) - len(_list))/4,_listS
pygame.init()
size=(600,600)
d=12
font = pygame.font.SysFont('songti', 20)
screen = pygame.display.set_mode((1200,600))
clock = pygame.time.Clock()
FPS = 100
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GRAY  = (200, 200, 200)

input_text = ""
output_text = ""
show_list=[]
inputed_text=''
input_rect = pygame.Rect(625, 15, 550, 40)

with open('程序1.txt', 'r', encoding='utf-8') as p:
    program=p.read()
code=program.splitlines()
codes=[]
n=0
for i in code:
    codes.append(countingSpace(i))
#print(codes)
x,y=0,0
position=[0,0]
dutyList=[]
dutyListX=[]
dutyListY=[]
cycList=[]
specialList=[]
dutyColor=(139,69,19)
art=False
asking=False
end=False
lib_list=[]
while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_RETURN:
                show_list.insert(0,'输入：' + input_text)
                inputed_text = input_text
                input_text = ""
            elif event.key == pygame.K_BACKSPACE:
                input_text = input_text[:-1]
            elif asking:
                input_text += event.unicode
    screen.fill((0,0,0))
    x,y=position[0],position[1]
    if end:command=[0,[[]]]
    else:command=codes[n]
    get=((position in dutyList) or (position[0] in dutyListY) or (position[1] in dutyListX)) and (
            position not in specialList)
    if command[1][0]=='启用':
        if command[1][1] in ['美术']:
            image = pygame.image.load("库/美术/duty.png").convert_alpha()
            image = pygame.transform.scale(image, (size[0]/d/4, size[0]/d/4))
            imageMan = pygame.image.load("库/美术/man.jpg").convert_alpha()
            imageMan = pygame.transform.scale(imageMan, (size[0] / d / 2, size[0] / d / 2))
            art=True
        else:
            try:
                lib_list.append(importlib.import_module('库.'+command[1][1]+'.'+command[1][1]))
            except Exception as e:
                print(e)
                show_list.insert(0,'报错：库不存在')
    if command[1][0]=='循环：':
        k=0
        indentation=command[0]
        for i in range(n+1,len(codes)):
            if codes[i][0]>=indentation+1:
                k=k+1
            else:break
        cycList.append(list(range(n+1,n+1+k)))
    if command[1][0]=='侦测':

        if get:
            #print((position[0] in dutyListX) , (position[1] in dutyListY))
            n=cycList[-1][-1]
            cycList.pop(-1)
    if len(command[1])==2:
        if command[1][1]=='拉':
            if command[1][0]=='原地':
                dutyList.append(position)
                if not dutyList:dutyList=list(set(dutyList))
                if position in specialList:specialList.remove(position)
            if command[1][0]=='竖着':
                dutyListY.append(position[0])
                if not dutyListY:dutyListY=list(set(dutyListY))
                for i in specialList:
                    if i[0]==position[0]:specialList.remove(i)
            if command[1][0]=='横着':
                dutyListX.append(position[1])
                if not dutyListX:dutyListX=list(set(dutyListX))
                for i in specialList:
                    if i[1]==position[1]:specialList.remove(i)
        if command[1][1]=='捡':
            if command[1][0]=='原地':
                if position in dutyList:
                    dutyList.remove(position)
                specialList.append(position)
            if command[1][0]=='竖着':
                if position[0] in dutyListY:
                    dutyList.remove(position)
                for i in dutyListX:
                    specialList.append([position[0],i])
                if [position[0],i] in dutyList:dutyList.remove([position[0],i])
            if command[1][0]=='横着':
                if position[1] in dutyListX:
                    dutyList.remove(position)
                for i in dutyListY:
                    specialList.append([i,position[1]])
                if [i,position[1]] in dutyList:dutyList.remove([i,position[1]])
            if not specialList:specialList=list(set(specialList))

        if command[1][1].isdigit():
            k = int(command[1][1])
        elif command[1][1] == 'x':
            k = position[0]
        elif command[1][1] == 'y':
            k = position[1]
        elif command[1][1] == '问':
            asking = True
            if inputed_text.isdigit():
                k = int(inputed_text)
                inputed_text = ''
                asking = False
            else: k=0
        else:
            k = 0
        if command[1][0] == '左':
            x -= k
        elif command[1][0] == '右':
            x += k
        elif command[1][0] == '下':
            y -= k
        elif command[1][0] == '上':
            y += k
        position=[x,y]
    if command[1][0]=='说':
        if len(command[1])==2:
            if command[1][1]=='x':show_list.insert(0,'输出：'+str(x))
            elif command[1][1]=='y':show_list.insert(0,'输出：'+str(y))
            elif command[1][1]=='问':
                asking = True
                if inputed_text.isdigit():
                    k = int(inputed_text)
                    inputed_text = ''
                    asking = False
                else:
                    k = 0
            else:show_list.insert(0,'输出：'+command[1][1])
        else:show_list.insert(0,'输出：',get)
    for i in lib_list:
        n=i.check(dutyList,dutyListX,dutyListY,specialList,cycList,n,command,position,get)
    if not asking:
        if cycList!=[]:
            if n==cycList[-1][-1]:
                n=cycList[-1][0]-1
        n+=1
    if n>len(codes)-1:end=True

    for i in range(-int(size[0]/d/2),int(size[0]/d/2)+1):
        for j in range(-int(size[0]/d/2),int(size[0]/d/2)+1):
            _i=i
            j=j
            p=[_i,j]
            if ((p in dutyList) or (j in dutyListX) or (_i in dutyListY))and(p not in specialList):
                _i = _i * size[0] / d / 4 + size[0] / 2
                j = -j * size[0] / d / 4 + size[0] / 2
                if not art:
                    p=[_i,j]
                    pygame.draw.circle(screen,dutyColor,p,size[0]/d/8)
                else:
                    p=[_i-size[0] / d / 8,j-size[0] / d / 8]
                    screen.blit(image, p)
    if position[0]*300/d/2+size[0]/2<600:
        if not art:
            pygame.draw.circle(screen,'white',[position[0]*300/d/2+size[0]/2,-position[1]*300/d/2+size[1]/2],size[0]/d/12)
        else:
            p = [position[0]*300/d/2+size[0]/2 - size[0] / d / 4, -position[1]*300/d/2+size[1]/2 - size[0] / d / 4]
            screen.blit(imageMan, p)
    pygame.draw.line(screen, 'white', (600, 0), (600, 600))

    pygame.draw.rect(screen, GRAY, input_rect)
    pygame.draw.rect(screen, BLACK, input_rect, 2)
    if asking:
        input_surf = font.render('询问中：' + input_text, True, BLACK)
    else:
        input_surf = font.render(input_text, True, BLACK)
    screen.blit(input_surf, (input_rect.x + 5, input_rect.y + 5))
    for i in range(len(show_list)):
        output_surf = font.render(show_list[i], True, WHITE)
        screen.blit(output_surf, (625, 50 + i * 25))
    pygame.display.flip()
    clock.tick(FPS)

    pygame.display.flip()
